import { Request, Response } from 'express';
import { UnauthorizedException } from '../../common/exceptions';
import { successResponse } from '../../common/response';
import { advisorService } from './advisor.service';

const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

class AdvisorController {
  async sendMessage(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedException();
    const result = await advisorService.sendMessage(req.user.userId, req.body);
    return successResponse({ res, data: result, message: 'Advisor response generated successfully' });
  }

  async getSessionMessages(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedException();
    const result = await advisorService.getSessionMessages(req.user.userId, param(req.params.sessionId));
    return successResponse({ res, data: result });
  }
}

export const advisorController = new AdvisorController();
