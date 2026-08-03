import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MultipartFile } from '@fastify/multipart';
import { PayloadTooLargeError, ValidationError } from '../errors/index.js';

/** Map validated MIME types to safe file extensions */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
};

/**
 * Returns a safe file extension derived from a validated MIME type.
 * Falls back to empty string for unknown types.
 */
function mimeToExtension(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] || '';
}

/** Allowed MIME types for activity attachments */
export const ACTIVITY_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const;

/** Allowed MIME types for support entry attachments */
export const SUPPORT_ENTRY_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export interface SavedFile {
  path: string;
  mimeType: string;
  size: number;
  name: string;
}

/**
 * Ensures the upload directory exists, creating it recursively if needed.
 */
export async function ensureUploadDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/**
 * Validates and saves a multipart file to the upload directory.
 * Generates a unique filename using UUID to prevent collisions.
 *
 * @throws PayloadTooLargeError if file exceeds maxSizeMB
 * @throws ValidationError if MIME type is not in allowedMimeTypes
 */
export async function saveFile(
  file: MultipartFile,
  uploadDir: string,
  maxSizeMB: number,
  allowedMimeTypes: readonly string[],
): Promise<SavedFile> {
  const mimeType = file.mimetype;

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new ValidationError([
      {
        path: 'file',
        message: `Tipo de arquivo não permitido: ${mimeType}`,
        code: 'invalid_mime_type',
      },
    ]);
  }

  const buffer = await file.toBuffer();
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (buffer.length > maxSizeBytes) {
    throw new PayloadTooLargeError(`${maxSizeMB}MB`);
  }

  const ext = mimeToExtension(mimeType);
  const uniqueName = `${randomUUID()}${ext}`;
  const filePath = join(uploadDir, uniqueName);

  await ensureUploadDir(uploadDir);
  await writeFile(filePath, buffer);

  return {
    path: filePath,
    mimeType,
    size: buffer.length,
    name: file.filename,
  };
}

/**
 * Removes a file from storage. Gracefully handles missing files.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error: unknown) {
    // Gracefully ignore if file doesn't exist
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
}
