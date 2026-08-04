// Domain shapes for the auth module.

// Shape returned by token-creation flows (legacy token.service.ts).
export interface ILoginResponse {
  access_token: string;
  refresh_token: string;
}

// Fresh access + refresh token pair (camelCase, used by auth.service/controller).
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Returned after a successful signup.
export interface ISignupResponse {
  userId: string;
}

// Payload of a decoded JWT after verification.
export interface IDecodedToken {
  userId: string;
  roles: string[];
  tokenVersion: number;
}
