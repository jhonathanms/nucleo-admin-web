/**
 * Resizes an image file to meet specific dimensions and size limits.
 * @param file The original image file
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param maxSizeBytes Maximum size in bytes (e.g., 1048576 for 1MB)
 * @returns A promise that resolves to a resized File object
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  maxSizeBytes: number = 1048576
): Promise<File> {
  return new Promise((resolve, reject) => {
    // If file is already small enough and within dimensions, return as is
    // (We still process it to ensure it's a valid image and to normalize format if needed)

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output type to preserve transparency
        const supportsTransparency = [
          "image/png",
          "image/webp",
          "image/gif",
        ].includes(file.type);
        const outputType = supportsTransparency ? "image/webp" : "image/jpeg";

        // Try different quality settings to meet size limit
        const quality = 0.9;
        const attemptResize = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas toBlob failed"));
                return;
              }

              if (blob.size > maxSizeBytes && q > 0.1) {
                // If still too large, try lower quality
                attemptResize(q - 0.1);
              } else {
                // If webp failed to stay under limit or isn't supported as expected,
                // and we need transparency, we might be stuck with a larger PNG
                // but let's try to return what we have.
                const extension =
                  outputType === "image/webp" ? ".webp" : ".jpg";
                const newFileName = file.name.split(".")[0] + extension;

                const resizedFile = new File([blob], newFileName, {
                  type: outputType,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              }
            },
            outputType,
            q
          );
        };

        attemptResize(quality);
      };
      img.onerror = () => reject(new Error("Error loading image"));
    };
    reader.onerror = () => reject(new Error("Error reading file"));
  });
}
