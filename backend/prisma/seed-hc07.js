const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HC07 = {
  codigo: 'HC07',
  nombre: 'Faena Halal — Exportación (Arabia)',
  descripcion: 'Certificado Islámico de la Faena (Halal) para exportación de carnes a países de mayoría musulmana. Reconocido por el Saudi Halal Center.',
  camposFormulario: [
    { nombre: 'exportador',          label: 'Exporter / Exportador',                         tipo: 'texto',    requerido: true  },
    { nombre: 'productorCo',         label: 'Producer Co. / Empresa productora',              tipo: 'texto',    requerido: true  },
    { nombre: 'matadero',            label: 'Slaughtering House / Frigorífico',               tipo: 'texto',    requerido: true  },
    { nombre: 'supervisor',          label: 'Supervisor Name / Nombre supervisor',            tipo: 'texto',    requerido: true  },
    { nombre: 'importador',          label: 'Importer / Importador',                         tipo: 'texto',    requerido: true  },
    { nombre: 'blFechaEmbarque',     label: 'Bill of Lading No. & Date / B/L y fecha',       tipo: 'texto',    requerido: true  },
    { nombre: 'marcasEnvio',         label: 'Shipping Marks / Marcas de envío',              tipo: 'texto',    requerido: false },
    { nombre: 'pesoNeto',            label: 'Net Weight / Peso neto',                        tipo: 'texto',    requerido: true  },
    { nombre: 'pesoBruto',           label: 'Gross Weight / Peso bruto',                     tipo: 'texto',    requerido: true  },
    { nombre: 'transporte',          label: 'Transport / Transporte',                        tipo: 'texto',    requerido: false },
    { nombre: 'puertoEmbarque',      label: 'Loading Port / Puerto de embarque',             tipo: 'texto',    requerido: true  },
    { nombre: 'puertoDestino',       label: 'Destination Port / Puerto destino',             tipo: 'texto',    requerido: true  },
    { nombre: 'fechaFaena',          label: 'Slaughtering Date / Fecha de faena',            tipo: 'fecha',    requerido: true  },
    { nombre: 'fechaProduccion',     label: 'Production Date / Fecha de producción',         tipo: 'fecha',    requerido: true  },
    { nombre: 'fechaExpiracion',     label: 'Expiry Date / Fecha de vencimiento',            tipo: 'fecha',    requerido: true  },
    { nombre: 'descripcionCantidad', label: 'Description & Quantity / Descripción y cantidad', tipo: 'textarea', requerido: true  },
    { nombre: 'observaciones',       label: 'Remarks / Observaciones',                       tipo: 'textarea', requerido: false },
  ],
  variablesMapeadas: {
    '{{exportador}}':          'exportador',
    '{{productorCo}}':         'productorCo',
    '{{matadero}}':            'matadero',
    '{{supervisor}}':          'supervisor',
    '{{importador}}':          'importador',
    '{{blFechaEmbarque}}':     'blFechaEmbarque',
    '{{marcasEnvio}}':         'marcasEnvio',
    '{{pesoNeto}}':            'pesoNeto',
    '{{pesoBruto}}':           'pesoBruto',
    '{{transporte}}':          'transporte',
    '{{puertoEmbarque}}':      'puertoEmbarque',
    '{{puertoDestino}}':       'puertoDestino',
    '{{fechaFaena}}':          'fechaFaena',
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
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Times New Roman', Georgia, serif;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
  }

  .page {
    width: 210mm;
    height: 297mm;
    background: #f5f0de;
    position: relative;
    overflow: hidden;
  }

  /* SVG border overlay */
  .border-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  /* Content area */
  .content {
    position: absolute;
    top: 12mm; left: 12mm; right: 12mm; bottom: 10mm;
    z-index: 5;
    display: flex;
    flex-direction: column;
  }

  /* HEADER */
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 4px;
  }

  .logo-wrap {
    width: 62px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .logo-svg-wrap {
    width: 62px;
    height: 62px;
  }

  .header-center {
    flex: 1;
    text-align: center;
    line-height: 1.25;
  }

  .bismillah {
    font-size: 16px;
    color: #1a6b3c;
    font-weight: bold;
    direction: rtl;
  }

  .title-arabic {
    font-size: 27px;
    font-weight: bold;
    color: #1a6b3c;
    direction: rtl;
    margin: 1px 0;
  }

  .title-en {
    font-size: 10.5px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #111;
  }

  .title-es {
    font-size: 10px;
    color: #333;
    font-style: italic;
    margin-top: 1px;
  }

  /* DIVIDERS */
  .div-green { border: none; border-top: 2px solid #1a6b3c; margin: 3px 0; }
  .div-gold  { border: none; border-top: 1px solid #b8943a; margin: 2px 0; }

  /* INTRO PARAGRAPHS */
  .intro {
    font-size: 7.8px;
    line-height: 1.5;
    text-align: justify;
    color: #222;
    margin: 2px 0;
  }
  .intro-ar {
    font-size: 7.8px;
    line-height: 1.5;
    text-align: justify;
    direction: rtl;
    color: #222;
    margin: 2px 0;
  }

  /* FIELDS TABLE */
  .fields {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
    margin-top: 3px;
  }

  .fields tr { border-bottom: 1px solid #c8a84b; }
  .fields tr:first-child { border-top: 1px solid #c8a84b; }

  .f-en {
    font-weight: bold;
    color: #1a6b3c;
    padding: 2.5px 5px 2.5px 3px;
    width: 36%;
    white-space: nowrap;
    vertical-align: middle;
  }

  .f-val {
    padding: 2.5px 5px;
    border-left: 1px dashed #b8943a;
    border-right: 1px dashed #b8943a;
    min-height: 18px;
    color: #111;
    vertical-align: middle;
    font-size: 8.5px;
  }

  .f-ar {
    font-weight: bold;
    color: #1a6b3c;
    padding: 2.5px 3px 2.5px 5px;
    width: 28%;
    text-align: right;
    direction: rtl;
    vertical-align: middle;
  }

  .f-val.tall { min-height: 40px; vertical-align: top; padding-top: 3px; }

  /* REMARKS */
  .remarks-lbl { font-weight: bold; font-size: 9px; color: #1a6b3c; margin: 4px 0 2px; }
  .remarks-box {
    border: 1px solid #1a6b3c;
    min-height: 28px;
    padding: 3px 5px;
    font-size: 8.5px;
    background: rgba(255,255,255,0.35);
    line-height: 1.4;
    color: #111;
  }

  /* FOOTER */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 6px;
    padding-top: 5px;
    border-top: 2px solid #1a6b3c;
    gap: 8px;
  }

  .footer-col { flex: 1; text-align: center; }

  .footer-line {
    border-bottom: 1px solid #444;
    height: 52px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 3px;
    font-size: 9px;
    margin-bottom: 2px;
    color: #111;
  }

  .footer-stamp-svg { display: block; margin: 0 auto 2px; }

  .footer-lbl { font-size: 7.5px; font-weight: bold; color: #1a6b3c; line-height: 1.4; }

  /* ADDRESS BAR */
  .address-bar {
    background: #1a6b3c;
    color: #fff;
    text-align: center;
    font-size: 7px;
    padding: 2.5px 5px;
    margin-top: 5px;
    letter-spacing: 0.2px;
  }
</style>
</head>
<body>
<div class="page">

  <!-- ══════════════════════════════════════════
       ARABESQUE BORDER (SVG overlay)
       ══════════════════════════════════════════ -->
  <svg class="border-overlay" viewBox="0 0 794 1123" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Arabesque vine pattern — horizontal -->
      <pattern id="arabH" x="0" y="0" width="32" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,10 Q8,1 16,10 Q24,19 32,10" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M0,10 Q8,19 16,10 Q24,1 32,10" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round"/>
        <ellipse cx="16" cy="10" rx="3" ry="2" fill="rgba(255,255,255,0.55)" transform="rotate(45 16 10)"/>
        <circle cx="0"  cy="10" r="1.2" fill="rgba(255,255,255,0.45)"/>
        <circle cx="32" cy="10" r="1.2" fill="rgba(255,255,255,0.45)"/>
      </pattern>
      <!-- Arabesque vine pattern — vertical -->
      <pattern id="arabV" x="0" y="0" width="20" height="32" patternUnits="userSpaceOnUse">
        <path d="M10,0 Q1,8 10,16 Q19,24 10,32" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M10,0 Q19,8 10,16 Q1,24 10,32" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linecap="round"/>
        <ellipse cx="10" cy="16" rx="3" ry="2" fill="rgba(255,255,255,0.55)" transform="rotate(45 10 16)"/>
        <circle cx="10" cy="0"  r="1.2" fill="rgba(255,255,255,0.45)"/>
        <circle cx="10" cy="32" r="1.2" fill="rgba(255,255,255,0.45)"/>
      </pattern>
    </defs>

    <!-- ── Top green band ── -->
    <rect x="0"   y="0"    width="794" height="36" fill="#1a6b3c"/>
    <rect x="0"   y="0"    width="794" height="36" fill="url(#arabH)"/>
    <!-- ── Bottom green band ── -->
    <rect x="0"   y="1087" width="794" height="36" fill="#1a6b3c"/>
    <rect x="0"   y="1087" width="794" height="36" fill="url(#arabH)"/>
    <!-- ── Left green band ── -->
    <rect x="0"   y="0"    width="36"  height="1123" fill="#1a6b3c"/>
    <rect x="0"   y="0"    width="36"  height="1123" fill="url(#arabV)"/>
    <!-- ── Right green band ── -->
    <rect x="758" y="0"    width="36"  height="1123" fill="#1a6b3c"/>
    <rect x="758" y="0"    width="36"  height="1123" fill="url(#arabV)"/>

    <!-- ── Corner ornamental squares ── -->
    <rect x="0" y="0"     width="36" height="36"   fill="#0f4a28"/>
    <rect x="758" y="0"   width="36" height="36"   fill="#0f4a28"/>
    <rect x="0" y="1087"  width="36" height="36"   fill="#0f4a28"/>
    <rect x="758" y="1087" width="36" height="36"  fill="#0f4a28"/>
    <!-- Corner diamond ornaments -->
    <polygon points="18,5  31,18  18,31  5,18"  fill="#c8a84b" opacity="0.85"/>
    <polygon points="776,5 789,18 776,31 763,18" fill="#c8a84b" opacity="0.85"/>
    <polygon points="18,1092 31,1105 18,1118 5,1105" fill="#c8a84b" opacity="0.85"/>
    <polygon points="776,1092 789,1105 776,1118 763,1105" fill="#c8a84b" opacity="0.85"/>

    <!-- ── Gold inner line ── -->
    <rect x="40" y="40" width="714" height="1043" fill="none" stroke="#c8a84b" stroke-width="2"/>
    <!-- ── Inner green line ── -->
    <rect x="44" y="44" width="706" height="1035" fill="none" stroke="#1a6b3c" stroke-width="1.2"/>
  </svg>

  <!-- ══════════════════════════════════════════
       CERTIFICATE CONTENT
       ══════════════════════════════════════════ -->
  <div class="content">

    <!-- HEADER -->
    <div class="header-row">
      <!-- Saudi Halal Center logo -->
      <div class="logo-wrap">
        <svg class="logo-svg-wrap" viewBox="0 0 62 62" xmlns="http://www.w3.org/2000/svg">
          <circle cx="31" cy="31" r="29" fill="none" stroke="#1a6b3c" stroke-width="2.5"/>
          <circle cx="31" cy="31" r="25" fill="none" stroke="#c8a84b" stroke-width="1"/>
          <text x="31" y="17" text-anchor="middle" font-size="5.5" fill="#1a6b3c" font-family="serif" font-weight="bold">المركز السعودي</text>
          <text x="31" y="24" text-anchor="middle" font-size="5" fill="#1a6b3c" font-family="serif">للحلال</text>
          <!-- crescent -->
          <path d="M26,33 A8,8 0 1 0 36,33 A5,5 0 1 1 26,33Z" fill="#1a6b3c"/>
          <text x="31" y="48" text-anchor="middle" font-size="4.5" fill="#1a6b3c" font-family="sans-serif" font-weight="bold">Saudi Halal</text>
          <text x="31" y="54" text-anchor="middle" font-size="4" fill="#555" font-family="sans-serif">Center</text>
        </svg>
      </div>

      <!-- Center titles -->
      <div class="header-center">
        <div class="bismillah">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
        <div class="title-arabic">شهادة المنتج الحلال</div>
        <div class="title-en">Islamic (Halal) Slaughter Certificate</div>
        <div class="title-es">Certificado de Faena Islámica (Halal)</div>
      </div>

      <!-- UIC logo -->
      <div class="logo-wrap">
        <svg class="logo-svg-wrap" viewBox="0 0 62 62" xmlns="http://www.w3.org/2000/svg">
          <circle cx="31" cy="31" r="29" fill="none" stroke="#1a6b3c" stroke-width="2.5"/>
          <circle cx="31" cy="31" r="25" fill="none" stroke="#c8a84b" stroke-width="1"/>
          <!-- Minaret simplified -->
          <rect x="27" y="20" width="8" height="18" fill="#1a6b3c"/>
          <polygon points="31,13 24,20 38,20" fill="#1a6b3c"/>
          <rect x="25" y="36" width="12" height="3" fill="#1a6b3c"/>
          <text x="31" y="47" text-anchor="middle" font-size="6" fill="#1a6b3c" font-family="sans-serif" font-weight="bold">UIC</text>
          <text x="31" y="54" text-anchor="middle" font-size="3.8" fill="#555" font-family="sans-serif">Uruguay</text>
        </svg>
      </div>
    </div>

    <hr class="div-green">

    <!-- INTRO — English -->
    <p class="intro">The Uruguay Islamic Center certifies that ingredients used in this production comply with Islamic laws and that processing steps overseen by a chemical &amp; health supervisors of UIC. All adequate precautions were taken to prevent its contaminations with non-Halal and alcoholic products. Accordingly, this products is Halal and suitable for Muslims consumptions in all parts of the world.</p>
    <hr class="div-gold">
    <!-- INTRO — Arabic -->
    <p class="intro-ar">يشهد المركز الإسلامي في أوروغواي بأن جميع مكونات الشحنة المذكورة أدناه من حلال ومطابقة للشريعة الإسلامية، قد أشرف عليها من قبل السلطة الصحية ومفتشي المركز الإسلامي. وقد اتخذت جميع الاحتياطات اللازمة لمنع تلوثها بالمنتجات غير الحلال والكحولية. وبناءً على ذلك، فإن هذا المنتج حلال ومناسب للاستهلاك لجميع المسلمين في كافة أنحاء العالم.</p>
    <hr class="div-gold">
    <!-- INTRO — Spanish -->
    <p class="intro">El Centro Islámico de Uruguay certifica que los ingredientes utilizados en esta producción cumplen con las leyes islámicas y que los pasos de procesamiento son supervisados por supervisores técnicos y sanitarios de UIC. Se tomaron todas las precauciones adecuadas para evitar su contaminación con productos alcohólicos y no Halal. En consecuencia, este producto es Halal y apto para el consumo de musulmanes en todas partes del mundo.</p>
    <hr class="div-green">

    <!-- FIELDS TABLE -->
    <table class="fields">
      <tr>
        <td class="f-en">Certif. N°:</td>
        <td class="f-val">{{nExpediente}}</td>
        <td class="f-ar">رقم الشهادة</td>
      </tr>
      <tr>
        <td class="f-en">Exporter:</td>
        <td class="f-val">{{exportador}}</td>
        <td class="f-ar">المُصدِّر</td>
      </tr>
      <tr>
        <td class="f-en">Producer Co.:</td>
        <td class="f-val">{{productorCo}}</td>
        <td class="f-ar">الشركة المُنتِجة</td>
      </tr>
      <tr>
        <td class="f-en">Slaughtering House:</td>
        <td class="f-val">{{matadero}}</td>
        <td class="f-ar">المسلخ / دار الذبح</td>
      </tr>
      <tr>
        <td class="f-en">Supervisor Name:</td>
        <td class="f-val">{{supervisor}}</td>
        <td class="f-ar">اسم المشرف</td>
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
        <td class="f-en">Net Weight:</td>
        <td class="f-val">{{pesoNeto}}</td>
        <td class="f-ar">الوزن الصافي</td>
      </tr>
      <tr>
        <td class="f-en">Gross Weight:</td>
        <td class="f-val">{{pesoBruto}}</td>
        <td class="f-ar">الوزن الإجمالي</td>
      </tr>
      <tr>
        <td class="f-en">Transport:</td>
        <td class="f-val">{{transporte}}</td>
        <td class="f-ar">وسيلة النقل</td>
      </tr>
      <tr>
        <td class="f-en">Loading Port:</td>
        <td class="f-val">{{puertoEmbarque}}</td>
        <td class="f-ar">ميناء التحميل</td>
      </tr>
      <tr>
        <td class="f-en">Destination Port:</td>
        <td class="f-val">{{puertoDestino}}</td>
        <td class="f-ar">ميناء الوجهة</td>
      </tr>
      <tr>
        <td class="f-en">Slaughtering Date:</td>
        <td class="f-val">{{fechaFaena}}</td>
        <td class="f-ar">تاريخ الذبح</td>
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
        <td class="f-en" style="vertical-align:top;padding-top:3px;">Description &amp; Quantity:</td>
        <td class="f-val tall">{{descripcionCantidad}}</td>
        <td class="f-ar" style="vertical-align:top;padding-top:3px;">تفاصيل الشحنة وكمياتها</td>
      </tr>
    </table>

    <!-- REMARKS -->
    <div class="remarks-lbl">Remarks / ملاحظات</div>
    <div class="remarks-box">{{observaciones}}</div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-col">
        <svg class="footer-stamp-svg" width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="none" stroke="#1a6b3c" stroke-width="2"/>
          <circle cx="30" cy="30" r="24" fill="none" stroke="#c8a84b" stroke-width="1"/>
          <text x="30" y="26" text-anchor="middle" font-size="5.5" fill="#1a6b3c" font-family="sans-serif" font-weight="bold">CENTRO ISLÁMICO</text>
          <text x="30" y="33" text-anchor="middle" font-size="5" fill="#1a6b3c" font-family="sans-serif">DEL URUGUAY</text>
          <text x="30" y="40" text-anchor="middle" font-size="5" fill="#555" font-family="sans-serif">Montevideo</text>
        </svg>
        <div class="footer-lbl">Official Stamp / Sello oficial<br>الختم الرسمي</div>
      </div>
      <div class="footer-col">
        <div class="footer-line">{{fechaEmision}}</div>
        <div class="footer-lbl">Date / Fecha<br>التاريخ</div>
      </div>
      <div class="footer-col">
        <div class="footer-line"></div>
        <div class="footer-lbl">Signature Director / Firma Director<br>توقيع مدير المركز</div>
      </div>
    </div>

    <!-- ADDRESS BAR -->
    <div class="address-bar">
      Soriano 1364 - Telefax: (00598) 2902 2578 - Montevideo - Uruguay - E-mail: c.islamico@adinet.com.uy
    </div>

  </div><!-- /content -->
</div><!-- /page -->
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
    // Update the existing record with the new template and fields
    const nuevaVersion = existente.versionActual + 1;
    await prisma.tipoCertificado.update({
      where: { codigo: HC07.codigo },
      data: {
        nombre:            HC07.nombre,
        descripcion:       HC07.descripcion,
        camposFormulario:  HC07.camposFormulario,
        plantillaHtml:     HC07.plantillaHtml,
        variablesMapeadas: HC07.variablesMapeadas,
        versionActual:     nuevaVersion,
        versiones: {
          create: {
            html:        HC07.plantillaHtml,
            version:     nuevaVersion,
            nota:        'Rediseño completo — borde árabe SVG, 3 párrafos intro, 17 campos',
            creadoPorId: admin.id,
          },
        },
      },
    });
    console.log(`✅ HC07 actualizado a v${nuevaVersion} (id: ${existente.id})`);
    return;
  }

  const tipo = await prisma.tipoCertificado.create({
    data: {
      codigo:            HC07.codigo,
      nombre:            HC07.nombre,
      descripcion:       HC07.descripcion,
      camposFormulario:  HC07.camposFormulario,
      plantillaHtml:     HC07.plantillaHtml,
      variablesMapeadas: HC07.variablesMapeadas,
      activo:            false,
      versionActual:     1,
      versiones: {
        create: {
          html:        HC07.plantillaHtml,
          version:     1,
          nota:        'Versión inicial — Certificado Faena Halal exportación Arabia',
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
