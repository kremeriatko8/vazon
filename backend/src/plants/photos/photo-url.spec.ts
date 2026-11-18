import { photoUrlFor } from './photo-storage.service.js';

describe('photoUrlFor', () => {
  const original = process.env.PUBLIC_API_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.PUBLIC_API_URL;
    else process.env.PUBLIC_API_URL = original;
  });

  it('is null without a key', () => {
    expect(photoUrlFor(null)).toBeNull();
  });

  it('is relative without PUBLIC_API_URL', () => {
    delete process.env.PUBLIC_API_URL;
    expect(photoUrlFor('abc.jpg')).toBe('/api/v1/uploads/abc.jpg');
  });

  it('is absolute with PUBLIC_API_URL, ignoring a trailing slash', () => {
    process.env.PUBLIC_API_URL = 'https://vazon-api.onrender.com/';
    expect(photoUrlFor('abc.jpg')).toBe(
      'https://vazon-api.onrender.com/api/v1/uploads/abc.jpg',
    );
  });
});
