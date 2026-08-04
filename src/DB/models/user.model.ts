import { Schema, model, models } from "mongoose";
import { IUser } from "../../common/interfaces/user.interface";
import { Role } from "../../common/enums/role.enum";
import { generateHash } from "../../common/utils/security/hash.security";

export { IUser };

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, select: false },
    roles: {
        type: [String],
        enum: Object.values(Role),
        default: [Role.TENANT],
        validate: {
            validator(value: Role[]) {
                return Array.isArray(value) && value.length > 0;
            },
            message: "User must have at least one role",
        },
    },
    activeRole: {
        type: String,
        enum: Object.values(Role),
        default: Role.TENANT,
        validate: {
            validator(this: IUser, value: Role) {
                return this.roles.includes(value);
            },
            message: "activeRole must be included in roles",
        },
    },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    savedListings: [{ type: Schema.Types.ObjectId, ref: "Listing", default: [] }],
    isVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
}, {
    timestamps: true
})

userSchema.pre("validate", function () {
    if (!this.password && !this.googleId) {
        this.invalidate("password", "User must have either a password or googleId");
    }
})

userSchema.pre("save", async function () {
    if (this.password && this.isModified("password")) {
        this.password = await generateHash({ plainText: this.password })
    }
})

export const UserModel = models.User || model<IUser>("User", userSchema)
