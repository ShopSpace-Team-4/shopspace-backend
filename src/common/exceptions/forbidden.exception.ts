import { AppException } from './app.exception';

export class ForbiddenException extends AppException {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}
