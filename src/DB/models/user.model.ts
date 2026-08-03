import { Schema, model, Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string; // hashed, never returned by default (select: false)
  role: Role;
  isVerified: boolean;
  tokenVersion: number; // incremented on logout / password change to revoke old refresh tokens
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never comes back on normal find() queries
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// email/phone already get a unique index from `unique: true` above;
// no extra indexes needed for Phase 1.

export const UserModel = model<IUser>('User', userSchema);
