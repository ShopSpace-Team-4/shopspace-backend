import crypto from 'node:crypto';
import { ENC_IV_LENGTH, ENC_KEY } from '../../../config/config';
import { BadRequestException } from '../../exceptions';

export const generateEncryption = async (plaintext: string): Promise<string> => {
  const iv = crypto.randomBytes(ENC_IV_LENGTH);

  const cipherIvVector = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);

  let cipherText = cipherIvVector.update(plaintext, 'utf-8', 'hex');
  cipherText += cipherIvVector.final('hex');

  console.log({
    iv,
    cipherIvVector,
    cipherText,
    ivHex: iv.toString('hex'),
  });

  return `${iv.toString('hex')}:${cipherText}`;
};



export const generateDecryption = async (
  cipherText: string
): Promise<string> => {
  const parts = cipherText.split(':');

  if (parts.length !== 2) {
    throw new BadRequestException('Invalid encryption format');
  }

  const iv = parts[0]!;
  const encryption = parts[1]!;

  const ivBinary = Buffer.from(iv, 'hex');

  console.log({
    iv,
    ivBinaryLength: ivBinary.length,
    encryptionLength: encryption.length,
  });

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      ENC_KEY,
      ivBinary
    );

    const plaintext =
      decipher.update(encryption, 'hex', 'utf8') +
      decipher.final('utf8');

    return plaintext;
  } catch (err) {
    console.error('DECRYPT ERROR:', err);
    throw err;
  } 
};