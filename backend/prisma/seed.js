const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const TIPOS_CERTIFICADO = [
  {
    codigo: 'HC01',
    nombre: 'Producto Alimenticio',
    descripcion: 'Certificación Halal para alimentos elaborados o procesados.',
    camposFormulario: [
      { nombre: 'nombreProducto', label: 'Nombre del producto', tipo: 'texto', requerido: true },
      { nombre: 'proceso', label: 'Proceso de elaboración', tipo: 'textarea', requerido: true },
      { nombre: 'paisOrigen', label: 'País de origen', tipo: 'texto', requerido: true },
      { nombre: 'ingredientes', label: 'Lista de ingredientes', tipo: 'textarea', requerido: true },
      { nombre: 'nLote', label: 'Número de lote', tipo: 'texto', requerido: false },
      { nombre: 'marcaComercial', label: 'Marca comercial', tipo: 'texto', requerido: false },
    ],
    variablesMapeadas: {
      '{{nombreProducto}}': 'nombreProducto',
      '{{proceso}}': 'proceso',
      '{{paisOrigen}}': 'paisOrigen',
      '{{ingredientes}}': 'ingredientes',
      '{{nLote}}': 'nLote',
      '{{marcaComercial}}': 'marcaComercial',
    },
    plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 30px; }
    .titulo { color: #1A6B3C; font-size: 28px; font-weight: bold; }
    .subtitulo { color: #C8A84B; font-size: 18px; }
    .campo { margin: 12px 0; }
    .etiqueta { font-weight: bold; color: #1A6B3C; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
    .qr { text-align: right; margin-top: -80px; }
    .expediente { font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">CERTIFICADO HALAL</div>
    <div class="subtitulo">Producto Alimenticio</div>
    <div class="expediente">Expediente: {{nExpediente}}</div>
  </div>
  <div class="campo"><span class="etiqueta">Producto:</span> {{nombreProducto}}</div>
  <div class="campo"><span class="etiqueta">Marca Comercial:</span> {{marcaComercial}}</div>
  <div class="campo"><span class="etiqueta">Proceso de Elaboración:</span> {{proceso}}</div>
  <div class="campo"><span class="etiqueta">País de Origen:</span> {{paisOrigen}}</div>
  <div class="campo"><span class="etiqueta">Ingredientes:</span> {{ingredientes}}</div>
  <div class="campo"><span class="etiqueta">N° de Lote:</span> {{nLote}}</div>
  <div class="campo"><span class="etiqueta">Empresa:</span> {{nombreEmpresa}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Emisión:</span> {{fechaEmision}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Vencimiento:</span> {{fechaVencimiento}}</div>
  <div class="footer">Verificado vía CERTIA — certia.uy | Centro Islámico del Uruguay</div>
</body>
</html>`,
  },
  {
    codigo: 'HC02',
    nombre: 'Materia Prima',
    descripcion: 'Certificación Halal para ingredientes destinados a la industria alimentaria.',
    camposFormulario: [
      { nombre: 'materiaPrima', label: 'Nombre de la materia prima', tipo: 'texto', requerido: true },
      { nombre: 'proveedor', label: 'Proveedor', tipo: 'texto', requerido: true },
      { nombre: 'paisOrigen', label: 'País de origen', tipo: 'texto', requerido: true },
      { nombre: 'fichaTecnica', label: 'Descripción ficha técnica', tipo: 'textarea', requerido: false },
      { nombre: 'especificaciones', label: 'Especificaciones técnicas', tipo: 'textarea', requerido: false },
    ],
    variablesMapeadas: {
      '{{materiaPrima}}': 'materiaPrima',
      '{{proveedor}}': 'proveedor',
      '{{paisOrigen}}': 'paisOrigen',
      '{{fichaTecnica}}': 'fichaTecnica',
      '{{especificaciones}}': 'especificaciones',
    },
    plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 30px; }
    .titulo { color: #1A6B3C; font-size: 28px; font-weight: bold; }
    .subtitulo { color: #C8A84B; font-size: 18px; }
    .campo { margin: 12px 0; }
    .etiqueta { font-weight: bold; color: #1A6B3C; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">CERTIFICADO HALAL</div>
    <div class="subtitulo">Materia Prima</div>
    <div>Expediente: {{nExpediente}}</div>
  </div>
  <div class="campo"><span class="etiqueta">Materia Prima:</span> {{materiaPrima}}</div>
  <div class="campo"><span class="etiqueta">Proveedor:</span> {{proveedor}}</div>
  <div class="campo"><span class="etiqueta">País de Origen:</span> {{paisOrigen}}</div>
  <div class="campo"><span class="etiqueta">Ficha Técnica:</span> {{fichaTecnica}}</div>
  <div class="campo"><span class="etiqueta">Especificaciones:</span> {{especificaciones}}</div>
  <div class="campo"><span class="etiqueta">Empresa:</span> {{nombreEmpresa}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Emisión:</span> {{fechaEmision}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Vencimiento:</span> {{fechaVencimiento}}</div>
  <div class="footer">Verificado vía CERTIA — certia.uy | Centro Islámico del Uruguay</div>
</body>
</html>`,
  },
  {
    codigo: 'HC03',
    nombre: 'Establecimiento',
    descripcion: 'Certificación Halal para plantas o locales de producción.',
    camposFormulario: [
      { nombre: 'razonSocial', label: 'Razón social', tipo: 'texto', requerido: true },
      { nombre: 'direccion', label: 'Dirección del establecimiento', tipo: 'texto', requerido: true },
      { nombre: 'actividad', label: 'Actividad principal', tipo: 'texto', requerido: true },
      { nombre: 'capacidadProduccion', label: 'Capacidad de producción', tipo: 'texto', requerido: false },
      { nombre: 'responsable', label: 'Responsable técnico', tipo: 'texto', requerido: false },
    ],
    variablesMapeadas: {
      '{{razonSocial}}': 'razonSocial',
      '{{direccion}}': 'direccion',
      '{{actividad}}': 'actividad',
      '{{capacidadProduccion}}': 'capacidadProduccion',
      '{{responsable}}': 'responsable',
    },
    plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 30px; }
    .titulo { color: #1A6B3C; font-size: 28px; font-weight: bold; }
    .subtitulo { color: #C8A84B; font-size: 18px; }
    .campo { margin: 12px 0; }
    .etiqueta { font-weight: bold; color: #1A6B3C; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">CERTIFICADO HALAL</div>
    <div class="subtitulo">Establecimiento</div>
    <div>Expediente: {{nExpediente}}</div>
  </div>
  <div class="campo"><span class="etiqueta">Razón Social:</span> {{razonSocial}}</div>
  <div class="campo"><span class="etiqueta">Dirección:</span> {{direccion}}</div>
  <div class="campo"><span class="etiqueta">Actividad:</span> {{actividad}}</div>
  <div class="campo"><span class="etiqueta">Capacidad de Producción:</span> {{capacidadProduccion}}</div>
  <div class="campo"><span class="etiqueta">Responsable Técnico:</span> {{responsable}}</div>
  <div class="campo"><span class="etiqueta">Empresa:</span> {{nombreEmpresa}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Emisión:</span> {{fechaEmision}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Vencimiento:</span> {{fechaVencimiento}}</div>
  <div class="footer">Verificado vía CERTIA — certia.uy | Centro Islámico del Uruguay</div>
</body>
</html>`,
  },
  {
    codigo: 'HC04',
    nombre: 'Logística y Transporte',
    descripcion: 'Certificación Halal para empresas de transporte y almacenamiento.',
    camposFormulario: [
      { nombre: 'empresa', label: 'Nombre de la empresa', tipo: 'texto', requerido: true },
      { nombre: 'vehiculos', label: 'Descripción de vehículos', tipo: 'textarea', requerido: true },
      { nombre: 'rutas', label: 'Rutas operadas', tipo: 'texto', requerido: false },
      { nombre: 'responsable', label: 'Responsable operativo', tipo: 'texto', requerido: true },
      { nombre: 'tipoAlmacenamiento', label: 'Tipo de almacenamiento', tipo: 'texto', requerido: false },
    ],
    variablesMapeadas: {
      '{{empresa}}': 'empresa',
      '{{vehiculos}}': 'vehiculos',
      '{{rutas}}': 'rutas',
      '{{responsable}}': 'responsable',
      '{{tipoAlmacenamiento}}': 'tipoAlmacenamiento',
    },
    plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 30px; }
    .titulo { color: #1A6B3C; font-size: 28px; font-weight: bold; }
    .subtitulo { color: #C8A84B; font-size: 18px; }
    .campo { margin: 12px 0; }
    .etiqueta { font-weight: bold; color: #1A6B3C; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">CERTIFICADO HALAL</div>
    <div class="subtitulo">Logística y Transporte</div>
    <div>Expediente: {{nExpediente}}</div>
  </div>
  <div class="campo"><span class="etiqueta">Empresa:</span> {{empresa}}</div>
  <div class="campo"><span class="etiqueta">Vehículos:</span> {{vehiculos}}</div>
  <div class="campo"><span class="etiqueta">Rutas:</span> {{rutas}}</div>
  <div class="campo"><span class="etiqueta">Responsable:</span> {{responsable}}</div>
  <div class="campo"><span class="etiqueta">Tipo de Almacenamiento:</span> {{tipoAlmacenamiento}}</div>
  <div class="campo"><span class="etiqueta">Empresa Solicitante:</span> {{nombreEmpresa}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Emisión:</span> {{fechaEmision}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Vencimiento:</span> {{fechaVencimiento}}</div>
  <div class="footer">Verificado vía CERTIA — certia.uy | Centro Islámico del Uruguay</div>
</body>
</html>`,
  },
  {
    codigo: 'HC05',
    nombre: 'Cosméticos',
    descripcion: 'Certificación Halal para productos cosméticos y de cuidado personal.',
    camposFormulario: [
      { nombre: 'nombreProducto', label: 'Nombre del producto', tipo: 'texto', requerido: true },
      { nombre: 'formulacion', label: 'Formulación / composición', tipo: 'textarea', requerido: true },
      { nombre: 'marca', label: 'Marca', tipo: 'texto', requerido: true },
      { nombre: 'mercadoDestino', label: 'Mercado destino', tipo: 'texto', requerido: false },
      { nombre: 'categoria', label: 'Categoría del producto', tipo: 'texto', requerido: false },
    ],
    variablesMapeadas: {
      '{{nombreProducto}}': 'nombreProducto',
      '{{formulacion}}': 'formulacion',
      '{{marca}}': 'marca',
      '{{mercadoDestino}}': 'mercadoDestino',
      '{{categoria}}': 'categoria',
    },
    plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 30px; }
    .titulo { color: #1A6B3C; font-size: 28px; font-weight: bold; }
    .subtitulo { color: #C8A84B; font-size: 18px; }
    .campo { margin: 12px 0; }
    .etiqueta { font-weight: bold; color: #1A6B3C; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">CERTIFICADO HALAL</div>
    <div class="subtitulo">Cosméticos</div>
    <div>Expediente: {{nExpediente}}</div>
  </div>
  <div class="campo"><span class="etiqueta">Producto:</span> {{nombreProducto}}</div>
  <div class="campo"><span class="etiqueta">Marca:</span> {{marca}}</div>
  <div class="campo"><span class="etiqueta">Categoría:</span> {{categoria}}</div>
  <div class="campo"><span class="etiqueta">Formulación:</span> {{formulacion}}</div>
  <div class="campo"><span class="etiqueta">Mercado Destino:</span> {{mercadoDestino}}</div>
  <div class="campo"><span class="etiqueta">Empresa:</span> {{nombreEmpresa}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Emisión:</span> {{fechaEmision}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Vencimiento:</span> {{fechaVencimiento}}</div>
  <div class="footer">Verificado vía CERTIA — certia.uy | Centro Islámico del Uruguay</div>
</body>
</html>`,
  },
  {
    codigo: 'HC06',
    nombre: 'Restauración',
    descripcion: 'Certificación Halal para restaurantes y servicios de alimentación.',
    camposFormulario: [
      { nombre: 'nombreLocal', label: 'Nombre del local', tipo: 'texto', requerido: true },
      { nombre: 'direccionLocal', label: 'Dirección', tipo: 'texto', requerido: true },
      { nombre: 'menu', label: 'Descripción del menú Halal', tipo: 'textarea', requerido: true },
      { nombre: 'personalResponsable', label: 'Personal responsable', tipo: 'texto', requerido: true },
      { nombre: 'protocolos', label: 'Protocolos de higiene y manipulación', tipo: 'textarea', requerido: false },
    ],
    variablesMapeadas: {
      '{{nombreLocal}}': 'nombreLocal',
      '{{direccionLocal}}': 'direccionLocal',
      '{{menu}}': 'menu',
      '{{personalResponsable}}': 'personalResponsable',
      '{{protocolos}}': 'protocolos',
    },
    plantillaHtml: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 30px; }
    .titulo { color: #1A6B3C; font-size: 28px; font-weight: bold; }
    .subtitulo { color: #C8A84B; font-size: 18px; }
    .campo { margin: 12px 0; }
    .etiqueta { font-weight: bold; color: #1A6B3C; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="titulo">CERTIFICADO HALAL</div>
    <div class="subtitulo">Restauración</div>
    <div>Expediente: {{nExpediente}}</div>
  </div>
  <div class="campo"><span class="etiqueta">Local:</span> {{nombreLocal}}</div>
  <div class="campo"><span class="etiqueta">Dirección:</span> {{direccionLocal}}</div>
  <div class="campo"><span class="etiqueta">Menú Halal:</span> {{menu}}</div>
  <div class="campo"><span class="etiqueta">Personal Responsable:</span> {{personalResponsable}}</div>
  <div class="campo"><span class="etiqueta">Protocolos:</span> {{protocolos}}</div>
  <div class="campo"><span class="etiqueta">Empresa:</span> {{nombreEmpresa}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Emisión:</span> {{fechaEmision}}</div>
  <div class="campo"><span class="etiqueta">Fecha de Vencimiento:</span> {{fechaVencimiento}}</div>
  <div class="footer">Verificado vía CERTIA — certia.uy | Centro Islámico del Uruguay</div>
</body>
</html>`,
  },
];

const CONFIGURACIONES = [
  { clave: 'cert_expiry_days', valor: '365', descripcion: 'Días de vigencia de los certificados emitidos' },
  { clave: 'notify_days_before', valor: '30,15,7', descripcion: 'Días antes del vencimiento para enviar avisos (separados por coma)' },
  { clave: 'renewal_enable_days', valor: '60', descripcion: 'Días antes del vencimiento en que se habilita el botón de renovación' },
  { clave: 'otp_expiry_minutes', valor: '10', descripcion: 'Minutos de validez del código OTP para 2FA de administradores' },
  { clave: 'otp_max_intentos', valor: '3', descripcion: 'Máximo de intentos fallidos antes de invalidar el OTP' },
  { clave: 'nombre_institucion', valor: 'Centro Islámico del Uruguay', descripcion: 'Nombre de la institución emisora' },
  { clave: 'app_url', valor: 'http://localhost:3000', descripcion: 'URL base del backend' },
  { clave: 'frontend_url', valor: 'http://localhost:5173', descripcion: 'URL base del frontend' },
  { clave: 'login_max_intentos', valor: '5', descripcion: 'Máximo de intentos de login fallidos antes de bloqueo temporal' },
  { clave: 'login_bloqueo_minutos', valor: '15', descripcion: 'Minutos de bloqueo tras exceder intentos de login' },
];

async function main() {
  const checkOnly = process.argv.includes('--check');

  if (checkOnly) {
    const count = await prisma.admin.count();
    if (count > 0) {
      console.log('✅ Base de datos ya inicializada, saltando seed.');
      return;
    }
  }

  console.log('🌱 Iniciando seed de CERTIA v3...\n');

  // Admin por defecto
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@certia.uy' },
    update: { passwordHash, activo: true },
    create: {
      nombre: 'Administrador',
      email: 'admin@certia.uy',
      passwordHash,
      activo: true,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // Tipos de certificado HC01-HC06 (inactivos)
  for (const tipo of TIPOS_CERTIFICADO) {
    const creado = await prisma.tipoCertificado.upsert({
      where: { codigo: tipo.codigo },
      update: {},
      create: {
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        camposFormulario: tipo.camposFormulario,
        plantillaHtml: tipo.plantillaHtml,
        variablesMapeadas: tipo.variablesMapeadas,
        activo: false,
        versionActual: 1,
      },
    });
    // Crear versión 1 de cada plantilla
    await prisma.versionPlantilla.upsert({
      where: { tipoCertId_version: { tipoCertId: creado.id, version: 1 } },
      update: {},
      create: {
        tipoCertId: creado.id,
        html: tipo.plantillaHtml,
        version: 1,
        nota: 'Versión inicial',
        creadoPorId: admin.id,
      },
    });
    console.log(`✅ Tipo certificado creado: ${tipo.codigo} — ${tipo.nombre}`);
  }

  // Configuraciones por defecto
  for (const config of CONFIGURACIONES) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: {
        clave: config.clave,
        valor: config.valor,
        descripcion: config.descripcion,
        actualizadoPorId: admin.id,
      },
    });
  }
  console.log(`✅ ${CONFIGURACIONES.length} configuraciones por defecto cargadas`);

  console.log('\n🎉 Seed completado exitosamente.');
  console.log('\nCredenciales del admin:');
  console.log('  Email:    admin@certia.uy');
  console.log('  Password: Admin1234!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
