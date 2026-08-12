import { advisorService } from './advisor.service';
import { aiAdvisorService } from '../../common/services/ai-advisor.service';
import { chatSessionRepository } from '../../DB/repository/chat-session.repository';
import { listingService } from '../listing/listing.service';

jest.mock('../../common/services/ai-advisor.service', () => ({
  aiAdvisorService: {
    chat: jest.fn(),
    getSessionMessages: jest.fn(),
  },
}));

jest.mock('../../DB/repository/chat-session.repository', () => ({
  chatSessionRepository: {
    create: jest.fn(),
    findOwnedSession: jest.fn(),
    updateById: jest.fn(),
  },
}));

jest.mock('../listing/listing.service', () => ({
  listingService: {
    list: jest.fn(),
  },
}));

describe('AdvisorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips recommended listings when AI taxonomy cannot be mapped', async () => {
    jest.mocked(aiAdvisorService.chat).mockResolvedValue({
      session_id: 'session-1',
      answer: 'answer',
      disclaimer: 'disclaimer',
      sources: [
        {
          document_id: 'doc-1',
          title: 'Location guide',
          category: 'location',
          business_type: 'general',
        },
      ],
    });

    const response = await advisorService.sendMessage('64b64c06b0f5f0f5f0f5f0f5', { message: 'Where should I open?' });

    expect(response.recommendedListings).toEqual([]);
    expect(listingService.list).not.toHaveBeenCalled();
    expect(chatSessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ lastCategory: undefined }));
  });
});
