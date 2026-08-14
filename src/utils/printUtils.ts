/**
 * Unified Print Utility Function
 * Dynamically applies the 'printable-report-document' or 'printable-pdf-content' ID 
 * to the main active content container before triggering `window.print()` to ensure
 * consistent, error-free print formatting across all modules.
 */

export interface PrintOptions {
  /** Optional custom target element, ref, or selector string to print */
  target?: HTMLElement | string | null;
  /** Preferred printable ID: 'printable-report-document' (portrait) or 'printable-pdf-content' (landscape/fit) */
  printableId?: 'printable-report-document' | 'printable-pdf-content';
  /** Orientation hint */
  orientation?: 'portrait' | 'landscape';
}

export interface PrintDocumentOptions {
  /** Custom document title for print header */
  documentTitle?: string;
  /** Orientation hint: 'portrait' | 'landscape' */
  orientation?: 'portrait' | 'landscape';
  /** Custom extra CSS rules */
  extraStyles?: string;
  /** Whether to use hidden iframe printing to prevent main thread hanging (default: true) */
  useIframe?: boolean;
}

/**
 * Captures specific elements by ID or element reference and triggers browser printing,
 * ensuring print styles are correctly applied while bypassing the current app hanging issue.
 */
export function printDocument(
  elementOrId: HTMLElement | string | null | undefined,
  options: PrintDocumentOptions = {}
): void {
  let targetElement: HTMLElement | null = null;

  if (typeof elementOrId === 'string') {
    const rawId = elementOrId.startsWith('#') ? elementOrId.slice(1) : elementOrId;
    targetElement = document.getElementById(rawId) || document.querySelector<HTMLElement>(elementOrId);
  } else if (elementOrId instanceof HTMLElement) {
    targetElement = elementOrId;
  }

  if (!targetElement) {
    targetElement = document.querySelector<HTMLElement>(
      '#hr-a4-preview-page, #printable-report-document, #printable-pdf-content, #printable-control-sheet, #printable-landscape-sheet, #print-document-container, #offscreen-printable-report'
    ) || document.querySelector<HTMLElement>('[role="dialog"], .modal-content, main');
  }

  if (!targetElement) {
    console.warn('[printDocument] Target element not found for printing.');
    window.print();
    return;
  }

  const orientation = options.orientation || 'portrait';
  const title = options.documentTitle || document.title || 'Official Document';

  let headStyles = `<style>
    @page { size: A4 ${orientation}; margin: 10mm 8mm; }
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
    }
    .no-print, .print\\:hidden, .print-hidden, [data-no-print], button, nav { display: none !important; }
    .a4-page-sheet {
      page-break-after: always !important;
      break-after: page !important;
      margin-bottom: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    .a4-page-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    #printable-frame-wrapper, #printable-control-sheet, #printable-report-document, #printable-pdf-content, #hr-a4-preview-page, #print-document-container, #central-printable-document {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-size: 9.5pt !important;
    }
    h1, h2, h3, h4, table, tr, .avoid-break, .break-inside-avoid {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    p, li {
      orphans: 3;
      widows: 3;
    }
    ${options.extraStyles || ''}
  </style>`;

  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
    headStyles += el.outerHTML;
  });

  // Clone element and strip fixed modal height constraints if present
  const clonedTarget = targetElement.cloneNode(true) as HTMLElement;
  clonedTarget.style.maxHeight = 'none';
  clonedTarget.style.height = 'auto';
  clonedTarget.style.overflow = 'visible';
  clonedTarget.style.boxShadow = 'none';
  clonedTarget.style.border = 'none';

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${headStyles}
</head>
<body style="background:#ffffff; color:#000000;">
  <div id="printable-frame-wrapper">
    ${clonedTarget.outerHTML}
  </div>
</body>
</html>`;

  if (options.useIframe !== false) {
    printHtmlInHiddenIframe(fullHtml);
  } else {
    printCurrentView({ target: targetElement, orientation });
  }
}

export function printCurrentView(options: PrintOptions = {}): void {
  let elementToPrint: HTMLElement | null = null;

  // 1. Check if user provided an explicit target element or selector
  if (options.target) {
    if (typeof options.target === 'string') {
      elementToPrint = document.querySelector<HTMLElement>(options.target);
    } else if (options.target instanceof HTMLElement) {
      elementToPrint = options.target;
    }
  }

  // 2. Check for an active element with an existing printable ID in DOM
  if (!elementToPrint) {
    elementToPrint = document.querySelector<HTMLElement>(
      '#hr-a4-preview-page, #printable-report-document, #printable-pdf-content, #printable-control-sheet, #printable-landscape-sheet, #print-document-container, #offscreen-printable-report'
    );
  }

  // If a printable target container exists, delegate to printDocument for isolated iframe printing
  if (elementToPrint) {
    printDocument(elementToPrint, {
      orientation: options.orientation || 'portrait'
    });
    return;
  }

  // Fallback to window.print() if no specific target is located
  document.body.classList.add('printing-report-active');
  const cleanup = () => {
    document.body.classList.remove('printing-report-active');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  try {
    window.print();
  } catch (err) {
    console.error('Print trigger failed:', err);
  }
  setTimeout(cleanup, 2500);
}

/**
 * Safely prints HTML content using a hidden inline iframe.
 * Prevents window.open('') from opening aistudio.google.com tabs or hanging the app.
 */
export function printHtmlInHiddenIframe(htmlContent: string): void {
  try {
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);

    const frameDoc = printIframe.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (err) {
          console.error('Error invoking print inside hidden iframe:', err);
        }
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 2500);
      }, 600);
    }
  } catch (e) {
    console.error('Failed to create print iframe:', e);
  }
}


