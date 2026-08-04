import { Types } from "mongoose";
import { Role } from "../enums/role.enum";

export interface IUser {
    _id: Types.ObjectId
    firstName: string
    lastName: string
    email: string
    phone?: string
    password?: string
    roles: Role[]
    activeRole: Role
    googleId?: string
    avatarUrl?: string
    savedListings: Types.ObjectId[]
    isVerified: boolean
    tokenVersion: number
    changeCredentialsTime?: Date
    createdAt?: Date
    updatedAt?: Date
}
