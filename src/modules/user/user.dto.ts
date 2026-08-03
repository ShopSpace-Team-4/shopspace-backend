import { Role } from '../../common/enums/role.enum';

// Public-facing shape of a user (never includes the password hash).
export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}
