// Distinguishes what a given OTP code is allowed to be used for.
export enum OtpPurpose {
  VERIFY_ACCOUNT = 'verify_account',
  RESET_PASSWORD = 'reset_password',
}
