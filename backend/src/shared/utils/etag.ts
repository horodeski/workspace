/**
 * ETag utility for cache validation and conflict detection.
 *
 * Uses weak ETags based on the entity's updatedAt timestamp.
 * This is a lightweight approach — full content hashing can be added later.
 */

/**
 * Generate a weak ETag from an entity's updatedAt timestamp.
 * Format: W/"<unix-ms>"
 */
export function generateETag(entity: { updatedAt: Date }): string {
  return `W/"${entity.updatedAt.getTime()}"`;
}

/**
 * Parse an ETag string back to a timestamp (milliseconds since epoch).
 * Returns null if the ETag format is invalid.
 */
export function parseETag(etag: string): number | null {
  const match = etag.match(/^W\/"(\d+)"$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Check if a given If-Match ETag value matches the current entity's ETag.
 * Used for optimistic concurrency control — returns false if the client's
 * ETag is stale (entity was modified after the client last fetched it).
 */
export function isETagMatch(ifMatchHeader: string, entity: { updatedAt: Date }): boolean {
  const clientTimestamp = parseETag(ifMatchHeader);
  if (clientTimestamp === null) return false;
  return clientTimestamp === entity.updatedAt.getTime();
}
