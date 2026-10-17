/**
 * Client-side image optimization utilities for RouteX.
 * Converts images (JPEG, PNG, etc.) to modern, lightweight WebP format
 * with high perceptual quality and substantial bandwidth savings.
 */

/**
 * Format bytes into human-readable string (e.g. "185 KB", "2.4 MB")
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Compresses and converts an image File to WebP format.
 *
 * @param {File} file - The uploaded image File.
 * @param {Object} [options]
 * @param {number} [options.maxWidth=1600] - Maximum width before downscaling.
 * @param {number} [options.maxHeight=1600] - Maximum height before downscaling.
 * @param {number} [options.quality=0.82] - WebP quality factor (0.0 to 1.0).
 * @returns {Promise<{
 *   file: File,
 *   previewUrl: string,
 *   originalSize: number,
 *   compressedSize: number,
 *   savingsPercent: number,
 *   width: number,
 *   height: number
 * }>}
 */
export async function convertToWebP(
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}
) {
  if (!file) {
    throw new Error("No image file provided.");
  }

  // If already WebP and very small, we can preserve it
  const isWebP = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height) {
        width = img.width || 800;
        height = img.height || 600;
      }

      // If already small WebP with reasonable dimensions, return as is
      if (isWebP && file.size < 400 * 1024 && width <= maxWidth && height <= maxHeight) {
        const previewUrl = URL.createObjectURL(file);
        resolve({
          file,
          previewUrl,
          originalSize: file.size,
          compressedSize: file.size,
          savingsPercent: 0,
          width,
          height,
        });
        return;
      }

      // Calculate proportional downscale if exceeding bounds
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const previewUrl = URL.createObjectURL(file);
        resolve({
          file,
          previewUrl,
          originalSize: file.size,
          compressedSize: file.size,
          savingsPercent: 0,
          width,
          height,
        });
        return;
      }

      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP via canvas.toBlob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const previewUrl = URL.createObjectURL(file);
            resolve({
              file,
              previewUrl,
              originalSize: file.size,
              compressedSize: file.size,
              savingsPercent: 0,
              width,
              height,
            });
            return;
          }

          // Build .webp file name
          const originalName = file.name || "hazard_photo";
          const dotIdx = originalName.lastIndexOf(".");
          const baseName = dotIdx > 0 ? originalName.substring(0, dotIdx) : originalName;
          const webpFileName = `${baseName}.webp`;

          const webpFile = new File([blob], webpFileName, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(webpFile);
          const originalSize = file.size;
          const compressedSize = webpFile.size;
          const savingsPercent = Math.max(
            0,
            Math.round(((originalSize - compressedSize) / originalSize) * 100)
          );

          resolve({
            file: webpFile,
            previewUrl,
            originalSize,
            compressedSize,
            savingsPercent,
            width,
            height,
          });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode image. Please select a valid photo file."));
    };

    img.src = objectUrl;
  });
}
