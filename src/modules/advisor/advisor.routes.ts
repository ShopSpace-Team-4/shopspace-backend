import { Router } from 'express';
import { authenticate } from '../../middleware/authentication.middleware';
import { aiAdvisorRateLimiter } from '../../middleware/rate-limit.middleware';
import { validate } from '../../common/validation/general.valodation';
import { chatMessageSchema } from './advisor.validation';
import { advisorController } from './advisor.controller';

export const advisorRoutes = Router();

advisorRoutes.post('/chat', authenticate, aiAdvisorRateLimiter, validate(chatMessageSchema), advisorController.sendMessage);
advisorRoutes.get('/sessions/:sessionId/messages', authenticate, advisorController.getSessionMessages);
