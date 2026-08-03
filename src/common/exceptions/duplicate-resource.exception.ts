import { AppException } from './app.exception';

// Thrown when trying to create a resource that violates a uniqueness rule,
// e.g. signing up with an email or phone that's already registered.
export class DuplicateResourceException extends AppException {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`, 409);
  }
}
