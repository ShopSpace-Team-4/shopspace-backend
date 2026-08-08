import { Schema, model, models, Types } from 'mongoose';

export interface IChatSession {
  _id: Types.ObjectId;
  sessionId: string;
  userId: Types.ObjectId;
  lastCategory?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastCategory: { type: String, trim: true },
  },
  { timestamps: true }
);

chatSessionSchema.index({ sessionId: 1, userId: 1 });

export const ChatSessionModel = models.ChatSession || model<IChatSession>('ChatSession', chatSessionSchema);
