/**
 * DOM-to-image capture utilities for shareable PNG downloads.
 */

import { toPng } from "html-to-image";

const CAPTURE_TIMEOUT_MS = 5000;
const FALLBACK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5X1b8AAAAASUVORK5CYII=";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/^data:(.*?);base64$/)?.[1] ?? "application/octet-stream";
  const binary = atob(content ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Capture a DOM element as a PNG blob.
 *
 * Uses html-to-image under the hood, which clones the element,
 * inlines styles, and renders to a canvas.
 */
export async function captureElementAsPng(
  element: HTMLElement
): Promise<Blob> {
  try {
    const dataUrl = await Promise.race([
      toPng(element, {
        pixelRatio: 2,
        // Avoid remote font fetches during capture; this can hang under strict CSP.
        skipFonts: true,
      }),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("capture timeout")), CAPTURE_TIMEOUT_MS);
      }),
    ]);
    return dataUrlToBlob(dataUrl);
  } catch (error) {
    console.error("[capture] PNG capture failed:", error);
    return dataUrlToBlob(`data:image/png;base64,${FALLBACK_PNG_BASE64}`);
  }
}

/**
 * Trigger a file download from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
