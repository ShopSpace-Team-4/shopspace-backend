import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { OtpTokenModel, IOtpToken } from '../models/otp-token.model';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';

class OtpTokenRepository extends BaseRepository<IOtpToken> {
  constructor() {
    super(OtpTokenModel);
  }

  async findLatestByUserAndPurpose(userId: Types.ObjectId, purpose: OtpPurpose): Promise<IOtpToken | null> {
    return OtpTokenModel.findOne({ userId, purpose }).sort({ createdAt: -1 }).exec();
  }

  async deleteAllForUserAndPurpose(userId: Types.ObjectId, purpose: OtpPurpose): Promise<void> {
    await OtpTokenModel.deleteMany({ userId, purpose }).exec();
  }
}

export const otpTokenRepository = new OtpTokenRepository();
