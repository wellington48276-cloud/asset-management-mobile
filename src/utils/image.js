import { JPEG_QUALITY, MAX_IMAGE_EDGE } from '../config';

export function dataUrlToBlob(dataUrl) {
  const [header, encoded] = String(dataUrl).split(',');
  const match = header?.match(/data:(.*?);base64/);
  if (!match || !encoded) throw new Error('Imagem inválida.');

  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] || 'image/jpeg' });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(blob);
  });
}

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
    image.src = source;
  });
}

export function canvasToCompressedDataUrl(canvas, maxEdge = MAX_IMAGE_EDGE, quality = JPEG_QUALITY) {
  const width = canvas.width;
  const height = canvas.height;
  const longest = Math.max(width, height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;

  if (scale === 1) return canvas.toDataURL('image/jpeg', quality);

  const output = document.createElement('canvas');
  output.width = Math.max(1, Math.round(width * scale));
  output.height = Math.max(1, Math.round(height * scale));

  const context = output.getContext('2d', { alpha: false });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#000';
  context.fillRect(0, 0, output.width, output.height);
  context.drawImage(canvas, 0, 0, output.width, output.height);
  return output.toDataURL('image/jpeg', quality);
}

export async function compressDataUrl(dataUrl, maxEdge = MAX_IMAGE_EDGE, quality = JPEG_QUALITY) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  return canvasToCompressedDataUrl(canvas, maxEdge, quality);
}
