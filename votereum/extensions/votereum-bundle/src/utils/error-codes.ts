/**
 * Error codes for API responses
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  INVALID_PAYLOAD = "INVALID_PAYLOAD",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",

  // User-related errors
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_EXISTS = "USER_EXISTS",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",

  // Voter-related errors
  VOTER_NOT_REGISTERED = "VOTER_NOT_REGISTERED",
  VOTER_NOT_VERIFIED = "VOTER_NOT_VERIFIED",
  VOTER_ALREADY_VERIFIED = "VOTER_ALREADY_VERIFIED",

  // Election-related errors
  ELECTION_NOT_FOUND = "ELECTION_NOT_FOUND",
  ELECTION_EXPIRED = "ELECTION_EXPIRED",
  ELECTION_NOT_STARTED = "ELECTION_NOT_STARTED",

  // Vote-related errors
  ALREADY_VOTED = "ALREADY_VOTED",
  INVALID_VOTE = "INVALID_VOTE",
  CANDIDATE_NOT_FOUND = "CANDIDATE_NOT_FOUND",

  // Blockchain-related errors
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  WALLET_CONNECTION_FAILED = "WALLET_CONNECTION_FAILED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",

  // Verification-related errors
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
  VERIFICATION_PENDING = "VERIFICATION_PENDING",
  VERIFICATION_REJECTED = "VERIFICATION_REJECTED",
}

/**
 * Standard API error response structure
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
}

/**
 * Create a standardized error object
 * @param code Error code from ErrorCode enum
 * @param message Human-readable error message
 * @param details Additional error context (optional)
 */
export const createError = (
  code: ErrorCode,
  message: string,
  details?: any
): ApiError => {
  return {
    code,
    message,
    ...(details && { details }),
  };
};
