import { RedisClientType } from "redis"
import { createClient } from "redis"
import { REDIS_URI } from "../../config/config"
import { EmailEnum } from "../../common/enums"
import { Types } from "mongoose"
type RediskeyType = { email: string, subject?: EmailEnum }


export class RedisService {
    private readonly client: RedisClientType;

    constructor() {
        this.client = createClient({ url: REDIS_URI });
        this.handleEvents();
    }  

    private handleEvents() {
        this.client.on("error", (error) => {
            console.log(`REDIS ERROR: ${error}`);
        });

        this.client.on("ready", () => {
            console.log("Redis is ready 🥱");
        });
    }

    public async connect() {
        await this.client.connect();
        console.log("Connected to Redis");
    }

    otpKey = ({
        email,
        subject = EmailEnum.CONFIRM_EMAIL
    }: RediskeyType): string => {
        return `OTP::User::${email}::${subject}`;
    };

    maxAttemptOtpKey = ({
        email,
        subject = EmailEnum.CONFIRM_EMAIL
    }: RediskeyType): string => {
        return `${this.otpKey({ email, subject })}::MaxTrial`;
    };

    blockOtpKey = ({
        email,
        subject = EmailEnum.CONFIRM_EMAIL
    }: RediskeyType): string => {
        return `${this.otpKey({ email, subject })}::Block`;
    };

    baseRevokeTokenKey = (
        userId: Types.ObjectId | string
    ): string => {
        return `RevokeToken::${userId.toString()}`;
    };

    revokeTokenKey = ({
        userId,
        jti
    }: {
        userId: Types.ObjectId | string;
        jti: string;
    }): string => {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`;
    };

    set = async ({
        key,
        value,
        ttl = 60 * 60 * 24
    }: {
        key: string;
        value: any;
        ttl?: number;
    }): Promise<string | null> => {
        try {
            const data =
                typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);

            return ttl
                ? await this.client.set(key, data, { EX: ttl })
                : await this.client.set(key, data);
        } catch (error) {
            console.log(`Redis set error: ${error}`);
            return null;
        }
    };

    update = async ({
        key,
        value,
        ttl = 60 * 60 * 24
    }: {
        key: string;
        value: string | object;
        ttl?: number;
    }): Promise<string | number | null> => {
        try {
            const exists = await this.client.exists(key);

            if (!exists) return 0;

            return await this.set({
                key,
                value,
                ttl
            });
        } catch (error) {
            console.log(`Redis update error: ${error}`);
            return 0;
        }
    };

    get = async <T = any>(
        key: string
    ): Promise<T | null> => {
        try {
            const data = await this.client.get(key);

            if (!data) return null;

            try {
                return JSON.parse(data) as T;
            } catch {
                return data as T;
            }
        } catch (error) {
            console.log(`Redis get error: ${error}`);
            return null;
        }
    };

    ttl = async (key: string): Promise<number> => {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            console.log(`Redis ttl error: ${error}`);
            return -2;
        }
    };

    exists = async (key: string): Promise<number> => {
        try {
            return await this.client.exists(key);
        } catch (error) {
            console.log(`Redis exists error: ${error}`);
            return -2;
        }
    };

    incr = async (key: string): Promise<number> => {
        try {
            return await this.client.incr(key);
        } catch (error) {
            console.log(`Redis incr error: ${error}`);
            return -2;
        }
    };

    expire = async (
        key: string,
        ttl: number
    ): Promise<boolean> => {
        try {
            return await this.client.expire(key, ttl);
        } catch (error) {
            console.log(`Redis expire error: ${error}`);
            return false;
        }
    };

    mGet = async (
        keys: string[]
    ): Promise<(string | null)[]> => {
        try {
            if (!keys.length) return [];

            return await this.client.mGet(keys);
        } catch (error) {
            console.log(`Redis mGet error: ${error}`);
            return [];
        }
    };

    keys = async (prefix: string): Promise<string[]> => {
        try {
            return await this.client.keys(`${prefix}*`);
        } catch (error) {
            console.log(`Redis keys error: ${error}`);
            return [];
        }
    };

    deleteKey = async (
        key: string | string[]
    ): Promise<number> => {
        try {
            if (
                (typeof key === "string" && !key) ||
                (Array.isArray(key) && !key.length)
            ) {
                return 0;
            }

            return await this.client.del(key);
        } catch (error) {
            console.log(`Redis deleteKey error: ${error}`);
            return 0;
        }
    };
}
//singletone pattern to avoid connection multiple times

export const redisService = new RedisService();