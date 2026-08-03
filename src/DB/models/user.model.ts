import { Schema, model, models } from "mongoose";
import { IUser } from "../../common/interfaces/user.interface";
import { Role } from "../../common/enums/role.enum";
import { generateHash } from "../../common/utils/security/hash.security";

export { IUser };

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(Role), required: true },
    isVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
}, {
    timestamps: true
})

userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await generateHash({ plainText: this.password })
    }
})

export const UserModel = models.User || model<IUser>("User", userSchema)