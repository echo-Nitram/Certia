const Anthropic = require('@anthropic-ai/sdk');
const { fromPath } = require('pdf2pic');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `Sos un experto en diseño de certificados Halal.
Analizás imágenes de certificados PDF y generás:
1. Una plantilla HTML completa que replique fielmente el diseño visual.
2. La lista de campos del formulario con sus tipos.
3. Un nombre y descripción sugeridos para el tipo de certificado.

Respondé SIEMPRE con JSON válido en este formato exacto:
{
  "nombre": "string — nombre corto del tipo de certificado",
  "descripcion": "string — descripción del tipo",
  "campos": [
    {
      "nombre": "camelCase sin espacios",
      "label": "Etiqueta visible para el usuario",
      "tipo": "texto | textarea | numero | fecha | lista",
      "requerido": true | false,
      "opciones": ["solo si tipo=lista"]
    }
  ],
  "variablesMapeadas": {
    "{{nombreCampo}}": "nombreCampo"
  },
  "html": "<!DOCTYPE html>... plantilla HTML completa con variables {{campo}} ..."
}`;

async function convertirPdfAImagenes(pdfPath) {
  const tmpDir = path.join(os.tmpdir(), uuidv4());
  fs.mkdirSync(tmpDir, { recursive: true });

  const converter = fromPath(pdfPath, {
    density: 150,
    saveFilename: 'pagina',
    savePath: tmpDir,
    format: 'png',
    width: 1200,
    height: 1600,
  });

  // Convertir hasta 5 páginas
  const archivos = [];
  for (let i = 1; i <= 5; i++) {
    try {
      const result = await converter(i, { responseType: 'image' });
      if (result?.path) archivos.push(result.path);
    } catch {
      break; // Sin más páginas
    }
  }

  return { archivos, tmpDir };
}

async function obtenerApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const config = await prisma.configuracion.findUnique({ where: { clave: 'anthropic_api_key' } });
  return config?.valor || null;
}

async function analizarPdfConIA(pdfBuffer) {
  const apiKey = await obtenerApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no configurada. Configurala en Configuración → Integraciones.');
  }

  // Guardar PDF temporal
  const tmpPdf = path.join(os.tmpdir(), `${uuidv4()}.pdf`);
  fs.writeFileSync(tmpPdf, pdfBuffer);

  let tmpDir;
  try {
    const { archivos, tmpDir: dir } = await convertirPdfAImagenes(tmpPdf);
    tmpDir = dir;

    // Máximo 5 páginas para no exceder tokens
    const paginasAAnalizar = archivos.slice(0, 5);

    const imagenesContent = paginasAAnalizar.map(archivo => {
      const data = fs.readFileSync(archivo);
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: data.toString('base64'),
        },
      };
    });

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imagenesContent,
            {
              type: 'text',
              text: 'Analizá este certificado Halal y generá el JSON con la plantilla HTML y los campos del formulario.',
            },
          ],
        },
      ],
    });

    const texto = message.content[0].text;
    // Extraer JSON de la respuesta (puede venir con markdown code blocks)
    const jsonMatch = texto.match(/```json\s*([\s\S]+?)\s*```/) || texto.match(/(\{[\s\S]+\})/);
    if (!jsonMatch) throw new Error('La IA no devolvió un JSON válido.');

    return JSON.parse(jsonMatch[1]);
  } finally {
    // Limpiar temporales
    try {
      fs.unlinkSync(tmpPdf);
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

module.exports = { analizarPdfConIA };
