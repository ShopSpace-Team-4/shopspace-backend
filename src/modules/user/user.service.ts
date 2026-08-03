import { userRepository } from '../../DB/repository/user.repository';
import { generateHash, compareHash } from '../../common/utils/security';
import { NotFoundException, UnauthorizedException, DuplicateResourceException } from '../../common/exceptions';
import { UserProfileDto, UpdateProfileDto, UpdatePasswordDto } from './user.dto';
import { IUser } from '../../DB/models/user.model';

class UserService {
  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User');
    return this.toProfileDto(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    // If the phone number is changing, make sure it isn't already taken.
    if (dto.phone) {
      const existing = await userRepository.findOne({ phone: dto.phone });
      if (existing && existing._id.toString() !== userId) {
        throw new DuplicateResourceException('User', 'phone');
      }
    }

    const user = await userRepository.updateById(userId, dto);
    if (!user) throw new NotFoundException('User');
    return this.toProfileDto(user);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('User');

    const isMatch = await compareHash({ plainText: dto.currentPassword, cipherText: user.password });
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await generateHash({ plainText: dto.newPassword });
    // Bump tokenVersion too, so other logged-in devices/sessions are revoked.
    await userRepository.updateById(userId, {
      password: hashedPassword,
      tokenVersion: user.tokenVersion + 1,
    });
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await userRepository.deleteById(userId);
    if (!user) throw new NotFoundException('User');
  }

  private toProfileDto(user: IUser): UserProfileDto {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt!,
    };
  }
}

export const userService = new UserService();
