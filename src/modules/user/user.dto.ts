import { Role } from '../../common/enums/role.enum';

// Public-facing shape of a user (never includes the password hash).
export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: Role[];
  activeRole: Role;
  avatarUrl?: string;
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

export interface RoleDto {
  role: Role;
}

export interface LinkGoogleDto {
  idToken: string;
}
