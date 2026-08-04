import { BaseRepository } from './base.repository';
import { UserModel, IUser } from '../models/user.model';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, withPassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async findByEmailOrPhone(email: string, phone: string): Promise<IUser | null> {
    return UserModel.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] }).exec();
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return UserModel.findOne({ googleId }).exec();
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return UserModel.findById(id).select('+password').exec();
  }
}

export const userRepository = new UserRepository();
