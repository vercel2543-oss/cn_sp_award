export interface CompressionResult {
  file: File | Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
  fileType: 'image' | 'pdf';
  fileName: string;
}

// Recommended maximum PDF size for Firestore base64 storage (1.5 MB)
export const MAX_PDF_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB
export const MAX_PDF_SIZE_LABEL = '1.5 MB';

/**
 * Validates and processes a certificate file (Image or PDF).
 * - For images: Compresses to optimized JPEG ensuring sharp text and minimal storage.
 * - For PDFs: Checks size limits to save Firebase quota, and converts to Base64 data URL.
 */
export async function processCertificateFile(
  file: File,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.75
): Promise<CompressionResult> {
  // 1. Handle PDF files
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    if (file.size > MAX_PDF_SIZE_BYTES) {
      throw new Error(
        `ขนาดไฟล์ PDF เกินกำหนด (${formatBytes(file.size)}) เพื่อประหยัดพื้นที่ Cloud แนะนำให้ใช้ไฟล์ PDF ไม่เกิน ${MAX_PDF_SIZE_LABEL} หรือแปะลิงก์ Google Drive / OneDrive ในช่องลิงก์ภายนอกแทน`
      );
    }

    return new Promise((resolve, reject) => {
      const originalSize = file.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          file,
          dataUrl,
          originalSize,
          compressedSize: originalSize,
          reductionPercentage: 0,
          width: 0,
          height: 0,
          fileType: 'pdf',
          fileName: file.name
        });
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ PDF ได้'));
      reader.readAsDataURL(file);
    });
  }

  // 2. Handle Image files with Canvas compression
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        const targetMax = 1200;
        if (width > height) {
          if (width > targetMax) {
            height = Math.round((height * targetMax) / width);
            width = targetMax;
          }
        } else {
          if (height > targetMax) {
            width = Math.round((width * targetMax) / height);
            height = targetMax;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw with high quality interpolation for sharp certificate text
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Standardize output to high-compression JPEG
        const outputMime = 'image/jpeg';
        let outputQuality = quality || 0.75;
        let dataUrl = canvas.toDataURL(outputMime, outputQuality);

        // Progressive size reduction to guarantee base64 string safely stays under 250KB for Firestore
        if (dataUrl.length > 300000) {
          outputQuality = 0.6;
          dataUrl = canvas.toDataURL(outputMime, outputQuality);
        }
        if (dataUrl.length > 300000) {
          // If still over 300k chars, scale canvas down to 800px max
          const scale = 800 / Math.max(width, height);
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.round(width * scale);
          scaledCanvas.height = Math.round(height * scale);
          const sCtx = scaledCanvas.getContext('2d');
          if (sCtx) {
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            dataUrl = scaledCanvas.toDataURL(outputMime, 0.65);
          }
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression blob creation failed'));
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: outputMime,
              lastModified: Date.now()
            });

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const reduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

            resolve({
              file: compressedFile,
              dataUrl,
              originalSize,
              compressedSize,
              reductionPercentage: reduction,
              width,
              height,
              fileType: 'image',
              fileName: file.name
            });
          },
          outputMime,
          outputQuality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}

/**
 * Backward compatibility alias for compressImage
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.75
): Promise<CompressionResult> {
  return processCertificateFile(file, maxWidth, maxHeight, quality);
}

/**
 * Format bytes to readable string (e.g. 1.25 MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export type ExternalUrlType = 'drive' | 'youtube' | 'pdf' | 'facebook' | 'dropbox' | 'onedrive' | 'website';

/**
 * Detects the type and title of an external URL for badges and icons.
 */
export function detectExternalUrlType(url?: string): {
  type: ExternalUrlType;
  label: string;
  bgColor: string;
  textColor: string;
  iconType: string;
} {
  if (!url) {
    return { type: 'website', label: 'ลิงก์ภายนอก', bgColor: 'bg-slate-100', textColor: 'text-slate-700', iconType: 'link' };
  }

  const lowUrl = url.toLowerCase();

  if (lowUrl.includes('drive.google.com') || lowUrl.includes('docs.google.com')) {
    return { type: 'drive', label: 'Google Drive', bgColor: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', iconType: 'drive' };
  }
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
    return { type: 'youtube', label: 'YouTube Video', bgColor: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700', iconType: 'youtube' };
  }
  if (lowUrl.endsWith('.pdf') || lowUrl.includes('.pdf?')) {
    return { type: 'pdf', label: 'PDF Document', bgColor: 'bg-red-50 border-red-200', textColor: 'text-red-700', iconType: 'pdf' };
  }
  if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.watch')) {
    return { type: 'facebook', label: 'Facebook Post', bgColor: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', iconType: 'facebook' };
  }
  if (lowUrl.includes('onedrive') || lowUrl.includes('sharepoint')) {
    return { type: 'onedrive', label: 'Microsoft OneDrive', bgColor: 'bg-sky-50 border-sky-200', textColor: 'text-sky-700', iconType: 'cloud' };
  }
  if (lowUrl.includes('dropbox.com')) {
    return { type: 'dropbox', label: 'Dropbox', bgColor: 'bg-indigo-50 border-indigo-200', textColor: 'text-indigo-700', iconType: 'cloud' };
  }

  return { type: 'website', label: 'เว็บไซต์ / ข้อมูลภายนอก', bgColor: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', iconType: 'link' };
}
