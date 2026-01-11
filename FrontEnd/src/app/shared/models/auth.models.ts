/**
 * Authentication Models and Interfaces
 */

/**
 * Login request model
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response model with JWT token
 */
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: UserInfo;
  expiresIn?: number;
}
export interface SocialUser {
  id: string;              // User ID from provider (Google sub or Facebook id)
  name: string;            // Full name
  email: string;           // Email address
  photoUrl: string;        // Profile picture URL
  provider: 'GOOGLE' | 'FACEBOOK';  // Provider name (uppercase)
  token: string;       
}

export interface SocialLoginRequest {
  email?: string;
  password?:  string;
  provider: string;        // 'GOOGLE' or 'FACEBOOK'
  token:  string;           // ID token or access token from provider
  name?: string;           // User's full name
  photo?: string;          // Profile picture URL
  rememberMe:  boolean;     // Whether to persist login
}


/**
 * User information from JWT token claims
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  roles?: string[];
  companyId?: string;
}

/**
 * JWT Token Claims decoded from token payload
 */
export interface JwtTokenClaims {
  sub: string; // Subject (user ID)
  email: string;
  name?: string;
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
  iss?: string; // Issuer
  aud?: string; // Audience
  roles?: string[];
  [key: string]: any;
}

/**
 * Sign up request model
 */
export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName?: string;
}

/**
 * Sign up response model
 */
export interface SignUpResponse {
  success: boolean;
  message: string;
  userId?: string;
  token?: string;
}

/**
 * API error response model
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: { [key: string]: string[] };
  timestamp?: string;
}

/**
 * Generic API response model
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ErrorResponse;
}

/**
 * Token validation response
 */
export interface TokenValidationResponse {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: number;
  user?: UserInfo;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}
