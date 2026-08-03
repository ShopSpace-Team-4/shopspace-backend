import { AppException } from './app.exception';

export class NotFoundException extends AppException {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}
