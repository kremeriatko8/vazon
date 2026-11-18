/** Image formats accepted for plant photos. SVG is excluded: it can carry scripts. */
export type ImageType = 'jpg' | 'png' | 'webp';

export const IMAGE_CONTENT_TYPES: Record<ImageType, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Detects the format from the first bytes of the file ("magic numbers").
 * The file name and the Content-Type sent by the browser are not trusted.
 * Returns null for anything else.
 */
export function detectImageType(buffer: Buffer): ImageType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && PNG.every((byte, i) => buffer[i] === byte)) {
    return 'png';
  }
  // RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}
