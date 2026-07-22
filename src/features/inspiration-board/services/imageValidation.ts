export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export const MAX_IMAGE_SIZE = 5_242_880; // 5MB in bytes

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(
  mimeType: string,
  fileSize: number
): ImageValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Accepted formats: PNG, JPEG, GIF, WebP' };
  }
  if (fileSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image must be under 5MB' };
  }
  return { valid: true };
}
