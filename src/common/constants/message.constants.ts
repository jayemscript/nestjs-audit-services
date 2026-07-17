//src/common/constants/message.constant.ts
export const MESSAGES = {
  SUCCESS: {
    AUDITED: 'Audited Succesfully',
  },
  ERROR: {
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Not found',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    BAD_REQUEST: 'Bad request',
    INVALID_TOKEN: 'Invalid or expired token',
    TOKEN_EXPIRED: 'Token has expired',
  },
} as const;
