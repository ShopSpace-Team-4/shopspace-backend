import { z } from 'zod';
import { chatMessageSchema } from './advisor.validation';

export type ChatMessageDto = z.infer<typeof chatMessageSchema>;
