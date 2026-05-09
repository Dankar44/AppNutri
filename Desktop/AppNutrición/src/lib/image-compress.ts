export interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format?: "jpeg" | "png" | "webp" | "auto";
}

const PROFILE_PHOTO: CompressOptions = {
  maxWidth: 256,
  maxHeight: 256,
  quality: 0.80,
  format: "webp",
};

const LOGO: CompressOptions = {
  maxWidth: 800,
  maxHeight: 400,
  quality: 0.85,
  format: "webp",
};

export const IMAGE_PRESETS = { PROFILE_PHOTO, LOGO } as const;

export function compressImage(
  dataUrl: string,
  opts: CompressOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(
        opts.maxWidth / width,
        opts.maxHeight / height,
        1,
      );
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      let mime: string;
      if (opts.format === "webp") {
        mime = "image/webp";
      } else if (opts.format === "jpeg") {
        mime = "image/jpeg";
      } else if (opts.format === "png") {
        mime = "image/png";
      } else {
        const isPng = dataUrl.startsWith("data:image/png");
        mime = isPng ? "image/png" : "image/jpeg";
      }

      const compressed = canvas.toDataURL(mime, opts.quality);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => reject(new Error("Error al procesar la imagen"));
    img.src = dataUrl;
  });
}
