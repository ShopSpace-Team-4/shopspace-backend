import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { ChatSessionModel, IChatSession } from '../models/chat-session.model';

export class ChatSessionRepository extends BaseRepository<IChatSession> {
  constructor() {
    super(ChatSessionModel);
  }

  async findBySessionId(sessionId: string) {
    return ChatSessionModel.findOne({ sessionId }).exec();
  }

  async findOwnedSession(sessionId: string, userId: string) {
    return ChatSessionModel.findOne({
      sessionId,
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  async userOwnsSession(sessionId: string, userId: string) {
    return Boolean(await this.findOwnedSession(sessionId, userId));
  }
}

export const chatSessionRepository = new ChatSessionRepository();
