import { triggerDownload } from '../persistence/projectIo';

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  triggerDownload(new Blob([content], { type: `${mime};charset=utf-8` }), filename);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
