// Application constants for school backend system

export const APP_CONFIG = {
  NAME: "School Management System",
  VERSION: "1.0.0",
  DESCRIPTION: "Backend API for school management system",
  ENVIRONMENT: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 4000,
  GRAPHQL_PATH: "/graphql",
  UPLOADS_PATH: "/uploads",
};

export const DATABASE_CONFIG = {
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,
  MAX_CONNECTIONS: 100,
};

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "school-jwt-secret",
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  ALGORITHM: "HS256" as const,
};

export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || "localhost",
  PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  PASSWORD: process.env.REDIS_PASSWORD,
  DB: parseInt(process.env.REDIS_DB || "0", 10),
  KEY_PREFIX: "school:",
  SESSION_TTL: 86400, // 24 hours
};

export const AWS_CONFIG = {
  REGION: process.env.AWS_REGION || "us-east-1",
  S3_BUCKET: process.env.AWS_S3_BUCKET || "school-uploads",
  SQS_QUEUE_URL: process.env.AWS_SQS_QUEUE_URL,
  ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

export const EMAIL_CONFIG = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@school.com",
  FROM_NAME: process.env.FROM_NAME || "School Management System",
};

export const PAGINATION = {
  DEFAULT_LIMIT: 2147483647,
  DEFAULT_PAGE: 1,
};

export const MAX_TAX_DEPENDENTS = 20;
export const TAX_DEPENDENT_NAME_MAX_LENGTH = 100;
export const TAX_DEPENDENT_RELATION_MAX_LENGTH = 100;

export const CACHE_KEYS = {
  USER_PROFILE: "user:profile:",
  USER_PERMISSIONS: "user:permissions:",
  SCHOOL_CONFIG: "school:config",
  ACTIVE_SESSIONS: "sessions:active",
  RATE_LIMIT: "rate:limit:",
};

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  },
  API_REQUESTS: {
    MAX_REQUESTS: 1000,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
};
