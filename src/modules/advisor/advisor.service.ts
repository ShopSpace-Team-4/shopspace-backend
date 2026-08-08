import { Types } from 'mongoose';
import { chatSessionRepository } from '../../DB/repository/chat-session.repository';
import { AiAdvisorSource, aiAdvisorService } from '../../common/services/ai-advisor.service';
import { ForbiddenException } from '../../common/exceptions';
import { ListingStatus } from '../../common/enums';
import { listingService } from '../listing/listing.service';
import { ChatMessageDto } from './advisor.dto';

class AdvisorService {
  async sendMessage(userId: string, dto: ChatMessageDto) {
    const existingSession = dto.sessionId
      ? await this.findOwnedSessionOrThrow(userId, dto.sessionId)
      : null;

    const response = await aiAdvisorService.chat({
      message: dto.message,
      session_id: dto.sessionId ?? null,
      user_id: userId,
    });

    const category = this.getMostCommonCategory(response.sources);
    const recommendedListings = category ? await this.getRecommendedListings(category, userId) : [];

    if (existingSession) {
      if (category) await chatSessionRepository.updateById(existingSession._id, { lastCategory: category });
    } else {
      await chatSessionRepository.create({
        sessionId: response.session_id,
        userId: new Types.ObjectId(userId),
        lastCategory: category,
      });
    }

    return {
      sessionId: response.session_id,
      answer: response.answer,
      sources: response.sources,
      disclaimer: response.disclaimer,
      recommendedListings,
    };
  }

  async getSessionMessages(userId: string, sessionId: string) {
    await this.findOwnedSessionOrThrow(userId, sessionId);
    return aiAdvisorService.getSessionMessages(sessionId);
  }

  private async findOwnedSessionOrThrow(userId: string, sessionId: string) {
    const session = await chatSessionRepository.findOwnedSession(sessionId, userId);
    if (!session) {
      throw new ForbiddenException('Advisor session does not belong to this user');
    }
    return session;
  }

  private getMostCommonCategory(sources: AiAdvisorSource[] = []) {
    const counts = sources.reduce((acc, source) => {
      const category = source.category?.trim();
      if (!category) return acc;
      acc.set(category, (acc.get(category) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  private async getRecommendedListings(category: string, userId: string) {
    const listings = await listingService.list({
      category,
      status: ListingStatus.AVAILABLE,
      limit: '3',
      sort: 'createdAt:desc',
    }, userId);

    return listings.items;
  }
}

export const advisorService = new AdvisorService();
