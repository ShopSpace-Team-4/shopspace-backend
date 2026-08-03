import bcrypt from 'bcrypt'
import { SALT_ROUND } from '../../../config/config'
export const generateHash = async ({
    plainText,
    salt = SALT_ROUND
}: {
    plainText: string,
    salt?: number
}): Promise<string> => {
    return await bcrypt.hash(plainText, salt)
}

export const compareHash = async ({
    plainText,
    cipherText
}: {
    plainText: string,
    cipherText: string
}): Promise<boolean> => {
    return await bcrypt.compare(plainText, cipherText)

}