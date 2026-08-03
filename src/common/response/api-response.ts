import { Response } from 'express';

// Every controller sends responses through this helper so the whole API
// returns one consistent JSON shape: { success, message, data }.
export class ApiResponse {
  static success(res: Response, data: unknown = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static error(res: Response, message = 'Something went wrong', statusCode = 500, errors: unknown = null) {
    return res.status(statusCode).json({ success: false, message, errors });
  }
}
