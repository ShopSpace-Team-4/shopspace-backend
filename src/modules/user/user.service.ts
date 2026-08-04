import { userRepository } from '../../DB/repository/user.repository';
import { generateHash, compareHash } from '../../common/utils/security';
import { NotFoundException, UnauthorizedException, DuplicateResourceException, BadRequestException } from '../../common/exceptions';
import { UserProfileDto, UpdateProfileDto, UpdatePasswordDto, RoleDto, LinkGoogleDto } from './user.dto';
import { IUser } from '../../DB/models/user.model';
import { AuthTokensDto } from '../auth/auth.dto';
import { authService } from '../auth/auth.service';
import { googleAuthService } from '../../common/services/google-auth.service';
import { Role } from '../../common/enums/role.enum';

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

    if (!user.password) throw new UnauthorizedException('Current password is incorrect');
    const isMatch = await compareHash({ plainText: dto.currentPassword, cipherText: user.password });
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await generateHash({ plainText: dto.newPassword });
    // Bump tokenVersion too, so other logged-in devices/sessions are revoked.
    await userRepository.updateById(userId, {
      password: hashedPassword,
      tokenVersion: user.tokenVersion + 1,
    });
  }

  async updateActiveRole(userId: string, dto: RoleDto): Promise<UserProfileDto> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User');
    const roles = user.roles?.length ? user.roles : [user.activeRole || dto.role];
    if (!roles.includes(dto.role)) {
      throw new BadRequestException('Cannot activate a role that is not assigned to this account');
    }

    const updatedUser = await userRepository.updateById(userId, { activeRole: dto.role });
    if (!updatedUser) throw new NotFoundException('User');
    return this.toProfileDto(updatedUser);
  }

  async addRole(userId: string, dto: RoleDto): Promise<{ profile: UserProfileDto; tokens: AuthTokensDto }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User');

    const currentRoles = user.roles?.length ? user.roles : [user.activeRole || dto.role];
    const roles = currentRoles.includes(dto.role) ? currentRoles : [...currentRoles, dto.role];
    const updatedUser = await userRepository.updateById(userId, { roles });
    if (!updatedUser) throw new NotFoundException('User');

    return {
      profile: this.toProfileDto(updatedUser),
      tokens: authService.issueTokens(updatedUser),
    };
  }

  async linkGoogle(userId: string, dto: LinkGoogleDto): Promise<UserProfileDto> {
    const profile = await googleAuthService.verifyGoogleIdToken(dto.idToken);
    const linkedUser = await userRepository.findByGoogleId(profile.googleId);
    if (linkedUser && linkedUser._id.toString() !== userId) {
      throw new DuplicateResourceException('Google account');
    }

    const user = await userRepository.updateById(userId, {
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
    });
    if (!user) throw new NotFoundException('User');
    return this.toProfileDto(user);
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await userRepository.deleteById(userId);
    if (!user) throw new NotFoundException('User');
  }

  private toProfileDto(user: IUser): UserProfileDto {
    const roles = user.roles?.length ? user.roles : [Role.TENANT];
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles,
      activeRole: roles.includes(user.activeRole) ? user.activeRole : roles[0],
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      createdAt: user.createdAt!,
    };
  }
}

export const userService = new UserService();
