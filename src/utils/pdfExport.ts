import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  margin?: [number, number, number, number];
  scale?: number;
  quality?: number;
}

let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

function getHelperCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!helperCtx) {
    helperCanvas = document.createElement('canvas');
    helperCanvas.width = 1;
    helperCanvas.height = 1;
    helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
  }
  return helperCtx;
}

export function convertOklabToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklab')) {
    return str;
  }

  let result = str.replace(/oklab\(([^)]+)\)/gi, (match, content) => {
    try {
      const slashSplit = content.split('/');
      const colorComponents = slashSplit[0].trim().split(/\s+/);
      const alphaComponent = slashSplit[1] ? slashSplit[1].trim() : undefined;

      if (colorComponents.length < 3) {
        return 'rgb(100, 116, 139)';
      }

      let l = parseFloat(colorComponents[0]);
      if (colorComponents[0].endsWith('%')) l /= 100;

      let aLab = parseFloat(colorComponents[1]);
      let bLab = parseFloat(colorComponents[2]);

      let alpha = 1;
      if (alphaComponent && alphaComponent !== 'none') {
        alpha = parseFloat(alphaComponent);
        if (alphaComponent.endsWith('%')) alpha /= 100;
      }

      if (isNaN(l)) l = 0.5;
      if (isNaN(aLab)) aLab = 0;
      if (isNaN(bLab)) bLab = 0;
      if (isNaN(alpha)) alpha = 1;

      // OKLAB -> LMS
      const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
      const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
      const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      // LMS -> Linear RGB
      const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const toSrgb = (x: number) => {
        const clamped = Math.max(0, Math.min(1, x));
        return clamped <= 0.0031308
          ? Math.round(clamped * 12.92 * 255)
          : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
      };

      const r = toSrgb(rLin);
      const g = toSrgb(gLin);
      const b = toSrgb(bLin);

      if (alpha < 1) {
        return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return 'rgb(100, 116, 139)';
    }
  });

  if (result.includes('oklab')) {
    result = result.replace(/oklab\([^)]*\)/gi, 'rgb(100, 116, 139)');
  }

  return result;
}

/**
 * Converts oklch(...) expressions in a string to valid rgb(...) or rgba(...) format
 * to prevent html2canvas parsing errors.
 */
export function convertOklchToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklch')) {
    return str;
  }

  let result = str.replace(/oklch\(([^)]+)\)/gi, (match, content) => {
    try {
      const slashSplit = content.split('/');
      const colorComponents = slashSplit[0].trim().split(/\s+/);
      const alphaComponent = slashSplit[1] ? slashSplit[1].trim() : undefined;

      if (colorComponents.length < 3) {
        return 'rgb(100, 116, 139)';
      }

      const lStr = colorComponents[0];
      const cStr = colorComponents[1];
      const hStr = colorComponents[2];

      let l = 0;
      if (lStr !== 'none') {
        l = parseFloat(lStr);
        if (lStr.endsWith('%')) l /= 100;
      }

      let c = 0;
      if (cStr !== 'none') {
        c = parseFloat(cStr);
        if (cStr.endsWith('%')) c /= 100;
      }

      let h = 0;
      if (hStr !== 'none') {
        h = parseFloat(hStr.replace('deg', ''));
      }

      let a = 1;
      if (alphaComponent && alphaComponent !== 'none') {
        a = parseFloat(alphaComponent);
        if (alphaComponent.endsWith('%')) a /= 100;
      }

      if (isNaN(l)) l = 0.5;
      if (isNaN(c)) c = 0;
      if (isNaN(h)) h = 0;
      if (isNaN(a)) a = 1;

      // OKLCH -> OKLAB
      const hRad = (h * Math.PI) / 180;
      const aLab = c * Math.cos(hRad);
      const bLab = c * Math.sin(hRad);

      // OKLAB -> LMS
      const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
      const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
      const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      // LMS -> Linear RGB
      const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const toSrgb = (x: number) => {
        const clamped = Math.max(0, Math.min(1, x));
        return clamped <= 0.0031308
          ? Math.round(clamped * 12.92 * 255)
          : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
      };

      const r = toSrgb(rLin);
      const g = toSrgb(gLin);
      const b = toSrgb(bLin);

      if (a < 1) {
        return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return 'rgb(100, 116, 139)';
    }
  });

  if (result.includes('oklch')) {
    result = result.replace(/oklch\([^)]*\)/gi, 'rgb(100, 116, 139)');
  }

  return result;
}

export function convertSingleColorToRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return 'rgb(30, 41, 59)';

  const ctx = getHelperCtx();
  if (ctx) {
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillStyle = colorStr;
      const data = ctx.getImageData(0, 0, 1, 1).data;
      if (!(data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0 && !colorStr.includes('transparent'))) {
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(3)})`;
      }
    } catch {
      // Fallback to math convert
    }
  }

  if (colorStr.includes('oklch')) {
    return convertOklchToRgb(colorStr);
  }

  if (colorStr.includes('oklab')) {
    return convertOklabToRgb(colorStr);
  }

  return 'rgb(30, 41, 59)';
}

export function resolveModernColorsInString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  let result = str;
  try {
    result = convertOklchToRgb(result);
    result = convertOklabToRgb(result);
    result = result.replace(/color-mix\([^)]+\)/gi, (match) => convertSingleColorToRgb(match));
    result = result.replace(/light-dark\([^)]+\)/gi, (match) => convertSingleColorToRgb(match));
  } catch (e) {
    console.warn('Failed in regex color translation:', e);
  }
  return result;
}

export async function exportToSinglePagePDF(
  elementOrId: HTMLElement | string,
  options: PDFExportOptions = {}
): Promise<boolean> {
  const generate = async (): Promise<boolean> => {
    const originalParentGetComputedStyle = window.getComputedStyle;
    let didOverrideParent = false;

    try {
      window.getComputedStyle = function (el: Element, pseudo?: string) {
        const styles = originalParentGetComputedStyle.call(window, el, pseudo);
        return new Proxy(styles, {
          get(target, prop) {
            if (typeof prop === 'string') {
              if (prop === 'getPropertyValue') {
                return function (propertyName: string) {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === 'string' && (
                    val.includes('oklch') ||
                    val.includes('oklab') ||
                    val.includes('color-mix') ||
                    val.includes('light-dark')
                  )) {
                    return resolveModernColorsInString(val);
                  }
                  return val;
                };
              }
            }
            const val = target[prop as keyof typeof target];
            if (typeof val === 'string' && (
              val.includes('oklch') ||
              val.includes('oklab') ||
              val.includes('color-mix') ||
              val.includes('light-dark')
            )) {
              return resolveModernColorsInString(val);
            }
            if (typeof val === 'function') {
              return (val as Function).bind(target);
            }
            return val;
          }
        }) as CSSStyleDeclaration;
      };
      didOverrideParent = true;
    } catch (e) {
      console.warn('Failed to override window.getComputedStyle:', e);
    }

    try {
      let element: HTMLElement | null = null;

      if (typeof elementOrId === 'string') {
        const rawId = elementOrId.startsWith('#') ? elementOrId.slice(1) : elementOrId;
        element =
          document.getElementById(rawId) ||
          document.querySelector<HTMLElement>(elementOrId) ||
          document.querySelector<HTMLElement>(`[id="${rawId}"]`) ||
          document.querySelector<HTMLElement>(`[data-pdf-id="${rawId}"]`);
      } else {
        element = elementOrId;
      }

      if (!element) {
        console.error(`Target element "${elementOrId}" not found for PDF generation`);
        return false;
      }

      const canvas = await html2canvas(element, {
        scale: options.scale || 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        onclone: (_clonedDoc: Document) => {
          const view = _clonedDoc.defaultView || window;
          if (view) {
            const origClonedGetComputedStyle = view.getComputedStyle;
            try {
              view.getComputedStyle = function (el: Element, pseudo?: string) {
                const styles = origClonedGetComputedStyle.call(view, el, pseudo);
                return new Proxy(styles, {
                  get(target, prop) {
                    if (typeof prop === 'string') {
                      if (prop === 'getPropertyValue') {
                        return function (propertyName: string) {
                          const val = target.getPropertyValue(propertyName);
                          if (typeof val === 'string' && (
                            val.includes('oklch') ||
                            val.includes('oklab') ||
                            val.includes('color-mix') ||
                            val.includes('light-dark')
                          )) {
                            return resolveModernColorsInString(val);
                          }
                          return val;
                        };
                      }
                    }
                    const val = target[prop as keyof typeof target];
                    if (typeof val === 'string' && (
                      val.includes('oklch') ||
                      val.includes('oklab') ||
                      val.includes('color-mix') ||
                      val.includes('light-dark')
                    )) {
                      return resolveModernColorsInString(val);
                    }
                    if (typeof val === 'function') {
                      return (val as Function).bind(target);
                    }
                    return val;
                  }
                }) as CSSStyleDeclaration;
              };
            } catch (e) {
              console.warn('Failed to override cloned view.getComputedStyle:', e);
            }
          }

          // 1. Hide all non-printable control elements, buttons, and no-print classes
          const nonPrintEls = _clonedDoc.querySelectorAll('.no-print, .print\\:hidden, .print-hidden, [data-no-print], button');
          nonPrintEls.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.setProperty('display', 'none', 'important');
            }
          });

          // 2. Sanitize all <style> elements
          const styleTags = _clonedDoc.querySelectorAll('style');
          styleTags.forEach((style) => {
            if (style.textContent) {
              style.textContent = resolveModernColorsInString(style.textContent);
            }
          });

          // 2. Sanitize inline element styles
          const elementsWithStyle = _clonedDoc.querySelectorAll('[style]');
          elementsWithStyle.forEach((el) => {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && (
              inlineStyle.includes('oklch') ||
              inlineStyle.includes('oklab') ||
              inlineStyle.includes('color-mix') ||
              inlineStyle.includes('light-dark')
            )) {
              el.setAttribute('style', resolveModernColorsInString(inlineStyle));
            }
          });

          // 3. Explicitly resolve computed colors on all elements for 100% html2canvas compatibility
          const allClonedElements = _clonedDoc.querySelectorAll('*');
          allClonedElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              try {
                const comp = view ? view.getComputedStyle(el) : null;
                if (comp) {
                  ['color', 'background-color', 'border-color', 'outline-color', 'fill', 'stroke'].forEach((prop) => {
                    const val = comp.getPropertyValue(prop);
                    if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix') || val.includes('light-dark'))) {
                      el.style.setProperty(prop, resolveModernColorsInString(val), 'important');
                    }
                  });
                }
              } catch {
                // ignore
              }
            }
          });

          const targetId = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
          const clonedTarget = (targetId
            ? _clonedDoc.getElementById(targetId)
            : _clonedDoc.querySelector('#printable-document')) as HTMLElement | null;

          if (clonedTarget) {
            clonedTarget.style.minHeight = '0px';
            clonedTarget.style.height = 'auto';
            clonedTarget.style.boxShadow = 'none';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', options.quality || 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
      pdf.save(options.filename || 'document.pdf');
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    } finally {
      if (didOverrideParent) {
        window.getComputedStyle = originalParentGetComputedStyle;
      }
    }
  };

  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      console.warn('PDF export generation timed out (8s safety limit)');
      resolve(false);
    }, 8000);
  });

  try {
    return await Promise.race([generate(), timeoutPromise]);
  } catch {
    return false;
  }
}


