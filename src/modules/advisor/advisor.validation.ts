import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string({ error: 'message is mandatory' }).min(2).max(2000),
  sessionId: z.string().min(1).optional(),
});
