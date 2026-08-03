import { userRepository } from '../../DB/repository/user.repository';
import { otpService } from '../../common/services/otp.service';
import { HashUtil } from '../../common/utils/hash.util';
import { JwtUtil } from '../../common/utils/jwt.util';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';
import { DuplicateResourceException, BadRequestException, UnauthorizedException, NotFoundException } from '../../common/exceptions';
import {
  SignupDto,
  LoginDto,
  VerifyAccountDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  AuthTokensDto,
} from './auth.dto';
import { IUser } from '../../DB/models/user.model';

class AuthService {
  // ---- Signup: create the user (unverified) and fire off the OTP email ----
  async signup(dto: SignupDto): Promise<{ userId: string }> {
    const existing = await userRepository.findByEmailOrPhone(dto.email, dto.phone);
    if (existing) {
      const field = existing.email === dto.email.toLowerCase() ? 'email' : 'phone';
      throw new DuplicateResourceException('User', field);
    }

    const hashedPassword = await HashUtil.hash(dto.password);

    const user = await userRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
    });

    await otpService.generateAndSend(user._id, user.email, OtpPurpose.VERIFY_ACCOUNT);

    return { userId: user._id.toString() };
  }

  // ---- Verify: consume the OTP and flip isVerified to true ----
  async verifyAccount(dto: VerifyAccountDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User');
    if (user.isVerified) throw new BadRequestException('Account is already verified');

    await otpService.verify(user._id, OtpPurpose.VERIFY_ACCOUNT, dto.otpCode);

    await userRepository.updateById(user._id, { isVerified: true });
  }

  // ---- Resend OTP: for verify-account only (reuses same flow) ----
  async resendOtp(dto: ResendOtpDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User');
    if (user.isVerified) throw new BadRequestException('Account is already verified');

    await otpService.generateAndSend(user._id, user.email, OtpPurpose.VERIFY_ACCOUNT);
  }

  // ---- Login: verify credentials + verification status, issue tokens ----
  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await userRepository.findByEmail(dto.email, true);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await HashUtil.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your account before logging in');
    }

    return this.issueTokens(user);
  }

  // ---- Logout: bump tokenVersion so existing refresh tokens are rejected ----
  async logout(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User');
    await userRepository.updateById(userId, { tokenVersion: user.tokenVersion + 1 });
  }

  // ---- Refresh: verify the refresh token and mint a new access token ----
  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    let payload;
    try {
      payload = JwtUtil.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User no longer exists');

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    return this.issueTokens(user);
  }

  // ---- Forgot password: send OTP with reset_password purpose ----
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    // Don't reveal whether the email exists — always respond the same way.
    if (!user) return;
    await otpService.generateAndSend(user._id, user.email, OtpPurpose.RESET_PASSWORD);
  }

  // ---- Reset password: verify OTP, set new password, revoke old sessions ----
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User');

    await otpService.verify(user._id, OtpPurpose.RESET_PASSWORD, dto.otpCode);

    const hashedPassword = await HashUtil.hash(dto.newPassword);
    await userRepository.updateById(user._id, {
      password: hashedPassword,
      tokenVersion: user.tokenVersion + 1, // logs out every existing session
    });
  }

  // ---- Shared helper: sign a fresh access + refresh token pair ----
  private issueTokens(user: IUser): AuthTokensDto {
    const payload = { userId: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion };
    return {
      accessToken: JwtUtil.signAccessToken(payload),
      refreshToken: JwtUtil.signRefreshToken(payload),
    };
  }
}

export const authService = new AuthService();
