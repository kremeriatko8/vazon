import { NotImplementedException } from '@nestjs/common';

/**
 * Used by draft endpoints whose request/response contract is agreed but whose
 * logic has not been written yet. They respond with HTTP 501.
 */
export function notImplemented(feature: string): never {
  throw new NotImplementedException(`${feature} is not implemented yet`);
}
