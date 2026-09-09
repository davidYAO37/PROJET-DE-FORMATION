interface EntrepriseInfo {
  LogoE?: string;
  EnteteSociete?: string;
  PiedPageSociete?: string;
}

export const generatePrintHeader = (entreprise: EntrepriseInfo | null): string => {
  if (!entreprise?.LogoE && !entreprise?.EnteteSociete) {
    return `
      <div class="header-static">
        <div style="text-align: center; font-weight: bold; font-size: 22px; color: #00AEEF; margin-bottom: 15px;">
          CENTRE MÉDICAL
        </div>
      </div>
    `;
  }

  let headerHTML = '<div class="header">';

  if (entreprise?.LogoE) {
    headerHTML += `<div class="img"><img src="${entreprise.LogoE}" alt="Logo" style="max-height: 120px; max-width: 120px;"></div>`;
  }

  if (entreprise?.EnteteSociete) {
    headerHTML += `<div class="header-text">${entreprise.EnteteSociete}</div>`;
  }

  headerHTML += '</div>';

  return headerHTML;
};

export const generatePrintFooter = (entreprise: EntrepriseInfo | null): string => {
  if (!entreprise?.PiedPageSociete) {
    return `
      <div class="footer-static" style="text-align: center; margin-top: 20px; font-size: 12px; font-style: italic;">
        <div>Merci pour votre confiance</div>
      </div>
    `;
  }

  return `
    <div class="footer" style="margin-top: 20px; font-size: 11px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
      ${entreprise.PiedPageSociete}
    </div>
  `;
};

export const getPrintCSS = (): string => {
  return `
    @media print {
      body { margin: 0; padding: 10px; }
      @page { margin: 10mm; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    body { 
      font-family: Arial, sans-serif; 
      background: #fff; 
      color: #000;
      padding: 20px;
      font-size: 13px !important;
    }
    .print-area {
      padding: 1rem !important;
    }
    .text-dark {
      color: #000 !important;
    }
    .text-center {
      text-align: center !important;
    }
    .text-end {
      text-align: right !important;
    }
    .fw-bold {
      font-weight: bold !important;
    }
    .d-flex {
      display: flex !important;
    }
    .flex-wrap {
      flex-wrap: wrap !important;
    }
    .justify-content-between {
      justify-content: space-between !important;
    }
    .text-nowrap {
      white-space: nowrap !important;
    }
    .me-3 {
      margin-right: 1rem !important;
    }
    .p-1 {
      padding: 0.25rem !important;
    }
    .mb-2 {
      margin-bottom: 0.5rem !important;
    }
    .mb-3 {
      margin-bottom: 1rem !important;
    }
    .mt-3 {
      margin-top: 1rem !important;
    }
    .mt-4 {
      margin-top: 1.5rem !important;
    }
    .table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 20px 0 !important;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
    }
    th, td { 
      border: 1px solid #000; 
      padding: 8px 4px; 
      text-align: center; 
    }
    th { 
      background: #f0f0f0; 
      font-weight: bold; 
    }
    .header { 
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      margin-bottom: 15px !important;
    }
    .header .img { 
      max-height: 120px !important;
      max-width: 120px !important;
      flex-shrink: 0 !important;
    }
    .header .header-text { 
      font-size: 14px !important;
      color: #666 !important;
      text-align: left !important;
      flex: 1 !important;
    }
    .header-static {
      text-align: center !important;
      margin-bottom: 15px !important;
    }
    .footer { 
      margin-top: 20px !important; 
      font-size: 12px !important; 
      text-align: center !important; 
      border-top: 1px solid #ccc !important; 
      padding-top: 10px !important; 
    }
    .footer-static {
      text-align: center !important;
      margin-top: 20px !important;
      font-size: 12px !important;
      font-style: italic !important;
    }
    .sub-header { 
      text-align: center !important; 
      font-size: 18px !important; 
      font-weight: bold !important; 
      margin-bottom: 20px !important; 
    }
    .info { 
      margin-bottom: 5px !important; 
      line-height: 1.4 !important; 
    }
    .no-print {
      display: none !important;
    }
    strong, b {
      font-weight: bold !important;
    }
    .badge {
      display: inline-block !important;
      padding: 0.25em 0.4em !important;
      font-size: 75% !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      text-align: center !important;
      white-space: nowrap !important;
      vertical-align: baseline !important;
      border-radius: 0.375rem !important;
    }
    .bg-success {
      background-color: #198754 !important;
      color: #fff !important;
    }
    .bg-warning {
      background-color: #ffc107 !important;
      color: #000 !important;
    }
    .bg-danger {
      background-color: #dc3545 !important;
      color: #fff !important;
    }
  `;
};

export const createPrintWindowWithoutHeader = (
  title: string,
  contentHTML: string
): Window | null => {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return null;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              margin-top: 50mm; /* 5cm pour l'en-tête physique */
              margin-bottom: 40mm; /* 4cm pour le pied de page physique */
            }
            @page { 
              margin: 0;
              size: A4;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          body { 
            font-family: Arial, sans-serif; 
            background: #fff; 
            color: #000;
            padding: 20px;
            font-size: 13px !important;
          }
          .print-area {
            padding: 1rem !important;
          }
          .text-dark {
            color: #000 !important;
          }
          .text-center {
            text-align: center !important;
          }
          .text-end {
            text-align: right !important;
          }
          .fw-bold {
            font-weight: bold !important;
          }
          .d-flex {
            display: flex !important;
          }
          .flex-wrap {
            flex-wrap: wrap !important;
          }
          .justify-content-between {
            justify-content: space-between !important;
          }
          .text-nowrap {
            white-space: nowrap !important;
          }
          .me-3 {
            margin-right: 1rem !important;
          }
          .p-1 {
            padding: 0.25rem !important;
          }
          .mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .mb-3 {
            margin-bottom: 1rem !important;
          }
          .mt-3 {
            margin-top: 1rem !important;
          }
          .mt-4 {
            margin-top: 1.5rem !important;
          }
          .table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 20px 0 !important;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 8px 4px; 
            text-align: center; 
          }
          th { 
            background: #f0f0f0; 
            font-weight: bold; 
          }
          strong, b {
            font-weight: bold !important;
          }
          .badge {
            display: inline-block !important;
            padding: 0.25em 0.4em !important;
            font-size: 75% !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            text-align: center !important;
            white-space: nowrap !important;
            vertical-align: baseline !important;
            border-radius: 0.375rem !important;
          }
          .bg-success {
            background-color: #198754 !important;
            color: #fff !important;
          }
          .bg-warning {
            background-color: #ffc107 !important;
            color: #000 !important;
          }
          .bg-danger {
            background-color: #dc3545 !important;
            color: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${contentHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Attendre que le contenu soit chargé avant d'imprimer
  setTimeout(() => {
    printWindow.print();

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }, 500);

  return printWindow;
};

export const createPrintWindow = (
  title: string,
  headerHTML: string,
  contentHTML: string,
  footerHTML: string
): Window | null => {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return null;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          ${getPrintCSS()}
        </style>
      </head>
      <body>
        ${headerHTML}
        ${contentHTML}
        ${footerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Attendre que le contenu soit chargé avant d'imprimer
  setTimeout(() => {
    printWindow.print();

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }, 500);
  return printWindow;
};

export const extractContentWithoutHeaderAndFooter = (contentHTML: string): string => {
  let restContent = contentHTML;

  // Supprimer le header
  const headerStart = contentHTML.indexOf('<div className="d-flex align-items-center justify-content-center"');
  if (headerStart !== -1) {
    let searchIndex = headerStart;
    let divCount = 0;
    let headerEnd = -1;

    for (let i = headerStart; i < contentHTML.length; i++) {
      const char = contentHTML[i];
      if (char === '<') {
        const nextChars = contentHTML.substring(i, i + 4);
        if (nextChars === '<div') {
          divCount++;
        } else if (nextChars === '</di') {
          divCount--;
          if (divCount === 0) {
            headerEnd = contentHTML.indexOf('>', i) + 1;
            break;
          }
        }
      }
    }

    if (headerEnd !== -1) {
      restContent = contentHTML.substring(headerEnd);
    }
  }

  // Supprimer le footer (contenant PiedPageSociete)
  const footerStart = restContent.indexOf('dangerouslySetInnerHTML={{ __html: entreprise.PiedPageSociete }}');
  if (footerStart !== -1) {
    // Trouver le début du div parent
    let divStart = restContent.lastIndexOf('<div', footerStart);
    if (divStart !== -1) {
      // Trouver la fin de ce div
      let searchIndex = divStart;
      let divCount = 0;
      let footerEnd = -1;

      for (let i = divStart; i < restContent.length; i++) {
        const char = restContent[i];
        if (char === '<') {
          const nextChars = restContent.substring(i, i + 4);
          if (nextChars === '<div') {
            divCount++;
          } else if (nextChars === '</di') {
            divCount--;
            if (divCount === 0) {
              footerEnd = restContent.indexOf('>', i) + 1;
              break;
            }
          }
        }
      }

      if (footerEnd !== -1) {
        restContent = restContent.substring(0, divStart) + restContent.substring(footerEnd);
      }
    }
  }

  return restContent;
};

export const extractContentWithoutHeader = (contentHTML: string): string => {
  const headerStart = contentHTML.indexOf('<div className="d-flex align-items-center justify-content-center"');
  let restContent = contentHTML;

  if (headerStart !== -1) {
    // Trouver la fin du header en cherchant la balise fermante du div principal
    let searchIndex = headerStart;
    let divCount = 0;
    let headerEnd = -1;

    for (let i = headerStart; i < contentHTML.length; i++) {
      const char = contentHTML[i];
      if (char === '<') {
        const nextChars = contentHTML.substring(i, i + 4);
        if (nextChars === '<div') {
          divCount++;
        } else if (nextChars === '</di') {
          divCount--;
          if (divCount === 0) {
            // Trouver la fin de cette balise div
            headerEnd = contentHTML.indexOf('>', i) + 1;
            break;
          }
        }
      }
    }

    if (headerEnd !== -1) {
      restContent = contentHTML.substring(headerEnd);
    }
  }

  return restContent;
};

/**
 * CSS de base pour une page A4 avec header / contenu / footer.
 * Le contenu pousse le footer en bas grace a flexbox.
 */
export const getA4PrintCSS = (): string => {
  return `
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      font-family: Arial, sans-serif;
      font-size: 13px;
      background: #fff;
      color: #000;
    }
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      /* Header / footer reperes sur chaque page via table layout */
      .a4-wrapper {
        display: table;
        min-height: auto;
        padding: 0;
        width: 100%;
      }
      .a4-header {
        display: table-header-group;
        margin: 0 !important;
        padding: 0 0 10mm 0 !important;
      }
      .a4-content {
        display: table-row-group;
        margin: 0;
        padding: 0;
      }
      .a4-footer {
        display: table-footer-group;
        margin: 0 !important;
        padding: 5px 0 0 0 !important;
        border-top: 1px solid #ccc;
      }
    }
    .a4-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
      padding: 10mm;
    }
    .a4-header {
      flex-shrink: 0;
      margin-bottom: 30px;
      padding-bottom: 10px;
    }
    .a4-header.no-header-space {
      margin-bottom: 0;
      padding-bottom: 0;
      visibility: hidden;
    }
    .a4-header.no-header-space > div {
      height: 25mm;
    }
    .a4-header .header,
    .a4-header .header-static {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .a4-header .header .img,
    .a4-header .header-static .img {
      max-height: 80px;
      max-width: 120px;
      flex-shrink: 0;
    }
    .a4-header .header .img img,
    .a4-header .header-static .img img {
      max-height: 80px;
      max-width: 120px;
    }
    .a4-header .header .header-text,
    .a4-header .header-static .header-text {
      font-size: 14px;
      color: #666;
      text-align: left;
      flex: 1;
      min-width: 200px;
    }
    .a4-content {
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
      padding-top: 10px;
    }
    .a4-footer {
      flex-shrink: 0;
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      font-size: 12px;
      text-align: center;
    }
    .text-center { text-align: center !important; }
    .fw-bold { font-weight: bold !important; }
    .table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 15px 0 !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px 4px;
      text-align: center;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
    }
  `;
};

/**
 * Ouvre une fenetre d'impression A4 avec header / contenu / footer.
 * Le footer est pousse en bas de la page grace au flexbox.
 */
export const createPrintWindowA4 = (
  title: string,
  headerHTML: string,
  contentHTML: string,
  footerHTML: string
): Window | null => {
  const printWindow = window.open('', '', 'width=900,height=700');
  if (!printWindow) return null;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${getA4PrintCSS()}
        </style>
      </head>
      <body>
        <div class="a4-wrapper">
          <div class="a4-header">${headerHTML}</div>
          <div class="a4-content">${contentHTML}</div>
          <div class="a4-footer">${footerHTML}</div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }, 600);

  return printWindow;
};

/**
 * Version A4 sans entete, uniquement contenu + footer en bas de page.
 */
export const createPrintWindowA4WithoutHeader = (
  title: string,
  contentHTML: string,
  footerHTML?: string
): Window | null => {
  const printWindow = window.open('', '', 'width=900,height=700');
  if (!printWindow) return null;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${getA4PrintCSS()}
        </style>
      </head>
      <body>
        <div class="a4-wrapper">
          <div class="a4-header no-header-space" style="visibility: hidden;">
            <div></div>
          </div>
          <div class="a4-content">${contentHTML}</div>
          ${footerHTML ? `<div class="a4-footer">${footerHTML}</div>` : ''}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }, 600);

  return printWindow;
};
