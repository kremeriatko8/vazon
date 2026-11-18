import { detectImageType } from './image-type.js';

const bytes = (...values: number[]) => Buffer.from(values);

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WebP by their first bytes', () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg');
    expect(
      detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe('png');
    expect(
      detectImageType(Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ')),
    ).toBe('webp');
  });

  it.each([
    [
      'SVG (can contain scripts)',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    ],
    ['GIF', Buffer.from('GIF89a')],
    ['HTML', Buffer.from('<!doctype html>')],
    ['empty file', Buffer.alloc(0)],
    ['truncated PNG header', bytes(0x89, 0x50, 0x4e)],
    [
      'RIFF that is not WebP (WAV)',
      Buffer.from('RIFF\u0000\u0000\u0000\u0000WAVE'),
    ],
  ])('rejects %s', (_label, buffer) => {
    expect(detectImageType(buffer)).toBeNull();
  });
});
