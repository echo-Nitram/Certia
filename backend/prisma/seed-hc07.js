const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HC07 = {
  codigo: 'HC07',
  nombre: 'Faena Halal — Exportación (Arabia)',
  descripcion: 'Certificado Islámico de la Faena (Halal) para exportación de carnes a países de mayoría musulmana. Reconocido por el Saudi Halal Center.',
  camposFormulario: [
    { nombre: 'exportador',         label: 'Exporter / Exportador',              tipo: 'texto',    requerido: true  },
    { nombre: 'productor',          label: 'Producer(s) / Productor(es)',         tipo: 'texto',    requerido: true  },
    { nombre: 'matadero',           label: 'Slaughtering House / Frigorífico',    tipo: 'texto',    requerido: true  },
    { nombre: 'supervisor',         label: 'Supervisor Name / Nombre supervisor', tipo: 'texto',    requerido: true  },
    { nombre: 'importador',         label: 'Importer / Importador',              tipo: 'texto',    requerido: true  },
    { nombre: 'blFechaEmbarque',    label: 'Bill of Lading N° & Date / B/L y fecha', tipo: 'texto', requerido: true },
    { nombre: 'marcasEnvio',        label: 'Shipping Marks / Marcas de envío',   tipo: 'texto',    requerido: false },
    { nombre: 'especie',            label: 'Species / Especie',                  tipo: 'texto',    requerido: true  },
    { nombre: 'pesosBrutos',        label: 'Gross Weight / Peso bruto',          tipo: 'texto',    requerido: true  },
    { nombre: 'pesosNetos',         label: 'Neto(s) / Peso neto',               tipo: 'texto',    requerido: true  },
    { nombre: 'puertoEmbarque',     label: 'Loading Port / Puerto de embarque',  tipo: 'texto',    requerido: true  },
    { nombre: 'puertoDestino',      label: 'Destination Port / Puerto destino',  tipo: 'texto',    requerido: true  },
    { nombre: 'fechaProduccion',    label: 'Production Date / Fecha de producción', tipo: 'fecha', requerido: true  },
    { nombre: 'fechaExpiracion',    label: 'Expiry Date / Fecha de vencimiento', tipo: 'fecha',    requerido: true  },
    { nombre: 'descripcionCantidad',label: 'Description & Quantity / Descripción y cantidad', tipo: 'textarea', requerido: true },
    { nombre: 'observaciones',      label: 'Remarks / Observaciones',            tipo: 'textarea', requerido: false },
  ],
  variablesMapeadas: {
    '{{exportador}}':          'exportador',
    '{{productor}}':           'productor',
    '{{matadero}}':            'matadero',
    '{{supervisor}}':          'supervisor',
    '{{importador}}':          'importador',
    '{{blFechaEmbarque}}':     'blFechaEmbarque',
    '{{marcasEnvio}}':         'marcasEnvio',
    '{{especie}}':             'especie',
    '{{pesosBrutos}}':         'pesosBrutos',
    '{{pesosNetos}}':          'pesosNetos',
    '{{puertoEmbarque}}':      'puertoEmbarque',
    '{{puertoDestino}}':       'puertoDestino',
    '{{fechaProduccion}}':     'fechaProduccion',
    '{{fechaExpiracion}}':     'fechaExpiracion',
    '{{descripcionCantidad}}': 'descripcionCantidad',
    '{{observaciones}}':       'observaciones',
  },
  plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Georgia, serif;
      background: #f9f3e3;
      color: #1a1a1a;
      width: 210mm;
      min-height: 297mm;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      background: #f9f3e3;
      position: relative;
      padding: 14mm 14mm 10mm;
    }

    /* Marco ornamental triple */
    .page::before {
      content: '';
      position: absolute;
      top: 5mm; left: 5mm; right: 5mm; bottom: 5mm;
      border: 6px solid #1a6b3c;
      pointer-events: none;
    }
    .page::after {
      content: '';
      position: absolute;
      top: 7mm; left: 7mm; right: 7mm; bottom: 7mm;
      border: 1.5px solid #c8a84b;
      pointer-events: none;
    }
    .inner-border {
      position: absolute;
      top: 8.5mm; left: 8.5mm; right: 8.5mm; bottom: 8.5mm;
      border: 1px solid #1a6b3c;
      pointer-events: none;
    }

    /* HEADER */
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 5px;
    }

    .logo-circle {
      width: 68px;
      height: 68px;
      border: 2.5px solid #1a6b3c;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 7px;
      font-weight: bold;
      color: #1a6b3c;
      line-height: 1.3;
      flex-shrink: 0;
      padding: 5px;
      background: rgba(255,255,255,0.6);
    }

    .header-center { flex: 1; text-align: center; }

    .bismillah {
      font-size: 17px;
      color: #1a6b3c;
      font-weight: bold;
      direction: rtl;
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .title-arabic {
      font-size: 26px;
      font-weight: bold;
      color: #1a6b3c;
      direction: rtl;
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .title-en {
      font-size: 11.5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #111;
    }

    .title-es {
      font-size: 10.5px;
      color: #444;
      font-style: italic;
    }

    /* DIVIDER */
    .divider {
      border: none;
      border-top: 2px solid #1a6b3c;
      margin: 5px 0;
    }
    .divider-thin {
      border: none;
      border-top: 1px solid #c8a84b;
      margin: 4px 0;
    }

    /* INTRO */
    .intro { font-size: 8.5px; line-height: 1.55; text-align: justify; margin-bottom: 3px; color: #222; }
    .intro-ar { font-size: 8.5px; line-height: 1.55; text-align: justify; direction: rtl; color: #222; }

    /* FIELDS TABLE */
    .fields {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
      font-size: 9.5px;
    }

    .fields tr { border-bottom: 1px solid #c8a84b; }
    .fields tr:first-child { border-top: 1px solid #c8a84b; }

    .f-en {
      font-weight: bold;
      color: #1a6b3c;
      padding: 4px 6px 4px 4px;
      width: 34%;
      white-space: nowrap;
      vertical-align: middle;
    }

    .f-val {
      padding: 4px 6px;
      border-left: 1px dashed #b8943a;
      border-right: 1px dashed #b8943a;
      min-height: 22px;
      color: #111;
      vertical-align: middle;
    }

    .f-ar {
      font-weight: bold;
      color: #1a6b3c;
      padding: 4px 4px 4px 6px;
      width: 30%;
      text-align: right;
      direction: rtl;
      vertical-align: middle;
    }

    .f-val.tall { min-height: 52px; vertical-align: top; padding-top: 5px; }

    /* REMARKS */
    .remarks-label {
      font-weight: bold;
      font-size: 9.5px;
      color: #1a6b3c;
      margin: 7px 0 3px;
    }
    .remarks-box {
      border: 1px solid #1a6b3c;
      min-height: 36px;
      padding: 5px 6px;
      font-size: 9.5px;
      background: rgba(255,255,255,0.4);
      line-height: 1.5;
    }

    /* FOOTER */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 14px;
      padding-top: 8px;
      border-top: 2px solid #1a6b3c;
      gap: 10px;
    }

    .footer-col {
      flex: 1;
      text-align: center;
    }

    .footer-line {
      border-bottom: 1px solid #555;
      height: 64px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 4px;
      font-size: 10px;
      margin-bottom: 3px;
    }

    .footer-stamp-circle {
      width: 72px;
      height: 72px;
      border: 2px solid #1a6b3c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2px;
      font-size: 7px;
      color: #1a6b3c;
      text-align: center;
    }

    .footer-label {
      font-size: 8.5px;
      font-weight: bold;
      color: #1a6b3c;
      line-height: 1.4;
    }

    .certia-bar {
      background: #1a6b3c;
      color: #fff;
      text-align: center;
      font-size: 7.5px;
      padding: 3px 6px;
      margin-top: 6px;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="inner-border"></div>

  <!-- HEADER -->
  <div class="header-row">
    <div class="logo-circle">
      <div style="font-size:8px;font-weight:bold;color:#1a6b3c;">Saudi<br>Halal<br>Center</div>
      <div style="font-size:6.5px;color:#555;margin-top:2px;">هيئة الحلال<br>السعودية</div>
    </div>

    <div class="header-center">
      <div class="bismillah">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
      <div class="title-arabic">شهادة المنشأ الحلال</div>
      <div class="title-en">Islamic (Halal) Slaughter Certificate</div>
      <div class="title-es">Certificado Islámico de la Faena (Halal)</div>
    </div>

    <div class="logo-circle">
      <div style="font-size:9px;font-weight:bold;color:#1a6b3c;">UIC</div>
      <div style="font-size:6.5px;color:#555;margin-top:2px;text-align:center;">Centro<br>Islámico<br>del Uruguay</div>
    </div>
  </div>

  <hr class="divider">

  <!-- INTRO -->
  <p class="intro">The Uruguay Islamic Center certifies that the following products comply with Islamic Sharia law, and that they are Halal &amp; Tayyib products. All animals and poultry are slaughtered in accordance with Islamic Rites by Muslim slaughtermen under the supervision of UIC and are thus suitable for Muslim consumption.</p>
  <hr class="divider-thin">
  <p class="intro-ar">يشهد المركز الإسلامي الأوروغوياني بأن المنتجات المذكورة أدناه تستوفي متطلبات الشريعة الإسلامية وأنها حلال وطيبة، وقد ذُبحت جميع الحيوانات على يد ذابحين مسلمين وفقاً للشعائر الإسلامية تحت إشراف المركز، وهي مناسبة للاستهلاك الإسلامي.</p>
  <hr class="divider">

  <!-- FIELDS -->
  <table class="fields">
    <tr>
      <td class="f-en">Cert. N°:</td>
      <td class="f-val">{{nExpediente}}</td>
      <td class="f-ar">رقم الشهادة</td>
    </tr>
    <tr>
      <td class="f-en">Exporter:</td>
      <td class="f-val">{{exportador}}</td>
      <td class="f-ar">المُصدِّر</td>
    </tr>
    <tr>
      <td class="f-en">Producer (s):</td>
      <td class="f-val">{{productor}}</td>
      <td class="f-ar">المُنتِج</td>
    </tr>
    <tr>
      <td class="f-en">Slaughtering House:</td>
      <td class="f-val">{{matadero}}</td>
      <td class="f-ar">المسلخ / دار الذبح</td>
    </tr>
    <tr>
      <td class="f-en">Supervisor Name:</td>
      <td class="f-val">{{supervisor}}</td>
      <td class="f-ar">اسم المشرف الذابح</td>
    </tr>
    <tr>
      <td class="f-en">Importer:</td>
      <td class="f-val">{{importador}}</td>
      <td class="f-ar">المستورد</td>
    </tr>
    <tr>
      <td class="f-en">Bill of Lading No. &amp; Date:</td>
      <td class="f-val">{{blFechaEmbarque}}</td>
      <td class="f-ar">رقم بوليصة الشحن وتاريخها</td>
    </tr>
    <tr>
      <td class="f-en">Shipping Marks:</td>
      <td class="f-val">{{marcasEnvio}}</td>
      <td class="f-ar">علامات الشحن</td>
    </tr>
    <tr>
      <td class="f-en">Species:</td>
      <td class="f-val">{{especie}}</td>
      <td class="f-ar">النوع</td>
    </tr>
    <tr>
      <td class="f-en">Gross Weight:</td>
      <td class="f-val">{{pesosBrutos}}</td>
      <td class="f-ar">الوزن الإجمالي</td>
    </tr>
    <tr>
      <td class="f-en">Neto(s):</td>
      <td class="f-val">{{pesosNetos}}</td>
      <td class="f-ar">صافي الوزن</td>
    </tr>
    <tr>
      <td class="f-en">Loading Port:</td>
      <td class="f-val">{{puertoEmbarque}}</td>
      <td class="f-ar">ميناء التحميل</td>
    </tr>
    <tr>
      <td class="f-en">Destination Port:</td>
      <td class="f-val">{{puertoDestino}}</td>
      <td class="f-ar">ميناء الوصول</td>
    </tr>
    <tr>
      <td class="f-en">Production Date:</td>
      <td class="f-val">{{fechaProduccion}}</td>
      <td class="f-ar">تاريخ الإنتاج</td>
    </tr>
    <tr>
      <td class="f-en">Expiry Date:</td>
      <td class="f-val">{{fechaExpiracion}}</td>
      <td class="f-ar">تاريخ انتهاء الصلاحية</td>
    </tr>
    <tr>
      <td class="f-en" style="vertical-align:top;padding-top:5px;">Description &amp; Quantity:</td>
      <td class="f-val tall">{{descripcionCantidad}}</td>
      <td class="f-ar" style="vertical-align:top;padding-top:5px;">الوصف والكمية</td>
    </tr>
  </table>

  <!-- REMARKS -->
  <div class="remarks-label">Remarks / ملاحظات</div>
  <div class="remarks-box">{{observaciones}}</div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-col">
      <div class="footer-stamp-circle">Sello<br>Oficial</div>
      <div class="footer-label">Official Stamp<br>Sello oficial</div>
    </div>
    <div class="footer-col">
      <div class="footer-line">{{fechaEmision}}</div>
      <div class="footer-label">Date / Fecha</div>
    </div>
    <div class="footer-col">
      <div class="footer-line"></div>
      <div class="footer-label">Signature-Director<br>Firma-Director</div>
    </div>
  </div>

  <div class="certia-bar">Centro Islámico del Uruguay (UIC) — Montevideo, Uruguay | certia.uy</div>
</div>
</body>
</html>`,
};

async function main() {
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.error('❌ No hay admin en la base de datos. Ejecutá el seed principal primero.');
    process.exit(1);
  }

  const existente = await prisma.tipoCertificado.findUnique({ where: { codigo: HC07.codigo } });
  if (existente) {
    console.log(`ℹ️  HC07 ya existe (id: ${existente.id}) — saltando.`);
    return;
  }

  const tipo = await prisma.tipoCertificado.create({
    data: {
      codigo:           HC07.codigo,
      nombre:           HC07.nombre,
      descripcion:      HC07.descripcion,
      camposFormulario: HC07.camposFormulario,
      plantillaHtml:    HC07.plantillaHtml,
      variablesMapeadas: HC07.variablesMapeadas,
      activo: false,
      versionActual: 1,
      versiones: {
        create: {
          html:    HC07.plantillaHtml,
          version: 1,
          nota:    'Versión inicial — Certificado Faena Halal exportación Arabia',
          creadoPorId: admin.id,
        },
      },
    },
  });

  console.log(`✅ HC07 creado: ${tipo.nombre} (id: ${tipo.id})`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
