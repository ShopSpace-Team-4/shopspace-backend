import { Types } from "mongoose";
import { Role } from "../enums/role.enum";

export interface IUser {
    _id: Types.ObjectId
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    role: Role
    isVerified: boolean
    tokenVersion: number
    changeCredentialsTime?: Date
    createdAt?: Date
    updatedAt?: Date
}