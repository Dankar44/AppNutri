import { compressImage, type CompressOptions } from "./image-compress";
export { IMAGE_PRESETS } from "./image-compress";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/webp";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });
}

export async function prepareImageUpload(
  file: File,
  preset: CompressOptions,
): Promise<FormData> {
  const dataUrl = await readFileAsDataUrl(file);
  const compressed = await compressImage(dataUrl, preset);
  const blob = dataUrlToBlob(compressed);
  const fd = new FormData();
  fd.append("imagen", blob, "image.webp");
  return fd;
}
