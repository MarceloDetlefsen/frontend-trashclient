import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    configured = true;
  }
}

export function useCloudinary(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

/**
 * Upload image buffer to Cloudinary and return the public URL.
 * Folder: trash/; public_id: trash/{id}
 */
export async function uploadTrashImage(
  buffer: Buffer,
  mimeType: string,
  id: string
): Promise<string> {
  ensureConfigured();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env'
    );
  }
  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'trash',
    public_id: id,
    overwrite: true,
    resource_type: 'image',
  });
  return result.secure_url;
}
