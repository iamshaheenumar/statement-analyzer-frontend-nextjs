/**
 * Server-side PDF text extraction.
 *
 * NOTE: pdfjs-dist requires a worker when bundled by webpack/turbopack.
 * The /api/parse route avoids this entirely by accepting pre-extracted
 * page content from the browser (see src/services/parsePDF.ts).
 *
 * This module is kept for potential direct server-to-server use cases
 * where the caller can supply a Buffer/ArrayBuffer directly.
 */

export class PasswordError extends Error {
  constructor() {
    super('PDF requires a password or the supplied password is incorrect');
    this.name = 'PasswordError';
  }
}
