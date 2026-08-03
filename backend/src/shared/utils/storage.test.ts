import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  ensureUploadDir,
  saveFile,
  deleteFile,
  ACTIVITY_ALLOWED_MIMES,
  SUPPORT_ENTRY_ALLOWED_MIMES,
} from './storage.js';

function createMockMultipartFile(options: {
  filename: string;
  mimetype: string;
  data: Buffer;
}) {
  return {
    filename: options.filename,
    mimetype: options.mimetype,
    toBuffer: async () => options.data,
  } as any;
}

describe('storage', () => {
  const testDir = join(tmpdir(), `storage-test-${randomUUID()}`);

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('ACTIVITY_ALLOWED_MIMES', () => {
    it('includes correct MIME types', () => {
      expect(ACTIVITY_ALLOWED_MIMES).toContain('image/jpeg');
      expect(ACTIVITY_ALLOWED_MIMES).toContain('image/png');
      expect(ACTIVITY_ALLOWED_MIMES).toContain('image/webp');
      expect(ACTIVITY_ALLOWED_MIMES).toContain('application/pdf');
      expect(ACTIVITY_ALLOWED_MIMES).toContain('text/plain');
      expect(ACTIVITY_ALLOWED_MIMES).toHaveLength(5);
    });
  });

  describe('SUPPORT_ENTRY_ALLOWED_MIMES', () => {
    it('includes correct MIME types', () => {
      expect(SUPPORT_ENTRY_ALLOWED_MIMES).toContain('image/jpeg');
      expect(SUPPORT_ENTRY_ALLOWED_MIMES).toContain('image/png');
      expect(SUPPORT_ENTRY_ALLOWED_MIMES).toContain('image/webp');
      expect(SUPPORT_ENTRY_ALLOWED_MIMES).toContain('application/pdf');
      expect(SUPPORT_ENTRY_ALLOWED_MIMES).not.toContain('text/plain');
      expect(SUPPORT_ENTRY_ALLOWED_MIMES).toHaveLength(4);
    });
  });

  describe('ensureUploadDir', () => {
    it('creates directory if it does not exist', async () => {
      const dir = join(testDir, 'nested', 'uploads');
      expect(existsSync(dir)).toBe(false);

      await ensureUploadDir(dir);

      expect(existsSync(dir)).toBe(true);
    });

    it('does not throw if directory already exists', async () => {
      await ensureUploadDir(testDir);
      await expect(ensureUploadDir(testDir)).resolves.toBeUndefined();
    });
  });

  describe('saveFile', () => {
    it('saves a valid file with UUID-based name', async () => {
      const data = Buffer.from('hello world');
      const file = createMockMultipartFile({
        filename: 'document.pdf',
        mimetype: 'application/pdf',
        data,
      });

      const result = await saveFile(file, testDir, 10, ACTIVITY_ALLOWED_MIMES);

      expect(result.name).toBe('document.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.size).toBe(data.length);
      expect(result.path).toMatch(/\.pdf$/);
      // Filename should be a UUID + extension, not the original name
      expect(result.path).not.toContain('document');

      const savedContent = await readFile(result.path);
      expect(savedContent.toString()).toBe('hello world');
    });

    it('rejects file with disallowed MIME type', async () => {
      const file = createMockMultipartFile({
        filename: 'malware.exe',
        mimetype: 'application/x-msdownload',
        data: Buffer.from('bad'),
      });

      await expect(
        saveFile(file, testDir, 10, ACTIVITY_ALLOWED_MIMES),
      ).rejects.toMatchObject({
        statusCode: 400,
        name: 'ValidationError',
      });
    });

    it('rejects file exceeding max size', async () => {
      // Create a buffer slightly over 1MB
      const data = Buffer.alloc(1024 * 1024 + 1);
      const file = createMockMultipartFile({
        filename: 'large.png',
        mimetype: 'image/png',
        data,
      });

      await expect(
        saveFile(file, testDir, 1, ACTIVITY_ALLOWED_MIMES),
      ).rejects.toMatchObject({
        statusCode: 413,
        name: 'PayloadTooLargeError',
      });
    });

    it('handles files without extension by deriving from MIME type', async () => {
      const file = createMockMultipartFile({
        filename: 'noext',
        mimetype: 'text/plain',
        data: Buffer.from('content'),
      });

      const result = await saveFile(file, testDir, 10, ACTIVITY_ALLOWED_MIMES);

      expect(result.name).toBe('noext');
      // Extension is now derived from MIME type, not from filename
      expect(result.path).toMatch(/\.txt$/);
      expect(result.size).toBe(7);
    });

    it('validates MIME types for support entries (no text/plain)', async () => {
      const file = createMockMultipartFile({
        filename: 'notes.txt',
        mimetype: 'text/plain',
        data: Buffer.from('notes'),
      });

      await expect(
        saveFile(file, testDir, 5, SUPPORT_ENTRY_ALLOWED_MIMES),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('deleteFile', () => {
    it('removes an existing file', async () => {
      await ensureUploadDir(testDir);
      const filePath = join(testDir, 'to-delete.txt');
      await writeFile(filePath, 'content');
      expect(existsSync(filePath)).toBe(true);

      await deleteFile(filePath);

      expect(existsSync(filePath)).toBe(false);
    });

    it('does not throw for non-existent file', async () => {
      const fakePath = join(testDir, 'nonexistent.txt');
      await expect(deleteFile(fakePath)).resolves.toBeUndefined();
    });
  });
});
