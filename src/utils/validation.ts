import z from "zod";

import { ValidationException } from "./errors";

type FirstArg<TFn> = TFn extends (args: infer TArg) => unknown ? TArg : never;

export function withValidation<TFn extends (args: never) => unknown>(fn: TFn) {
  type Args = FirstArg<TFn>;

  return (args: Args, validationSchema: z.ZodType<Args>): ReturnType<TFn> => {
    const result = validationSchema.safeParse(args);

    if (!result.success) {
      throw new ValidationException("Validation failed", "BAD_USER_INPUT", z.flattenError(result.error).fieldErrors);
    }

    return fn(result.data as never) as ReturnType<TFn>;
  };
}

export function hasProvided<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

export function isEmail(value: string): boolean {
  return z.email().safeParse(value).success;
}

export const MESSAGE_MAP = {
  INVALID: (field: string, type: string) => `The ${field} field is invalid, please provide a valid ${type}`,
  REQUIRED: (field: string) => `The ${field} field is required`,
  EMPTY: (field: string) => `The ${field} field cannot be empty`,
  MIN: (field: string, min: number) => `The ${field} field must be at least ${min}`,
  MAX: (field: string, max: number) => `The ${field} field must be at most ${max}`,
  MIN_LENGTH: (field: string, min: number) => `The ${field} field must be at least ${min} characters long`,
  MAX_LENGTH: (field: string, max: number) => `The ${field} field must be at most ${max} characters long`,
  ARRAY_MIN_LENGTH: (field: string, min: number) => `The ${field} field must have at least ${min} items selected`,
  ARRAY_MAX_LENGTH: (field: string, max: number) => `The ${field} field must have at most ${max} items selected`,
};

export const VALIDATION_RULES = {
  PAGINATION: {
    MIN_PAGE: {
      value: 1,
      message: "Page must be at least 1",
    },
    MIN_LIMIT: {
      value: 1,
      message: "Limit must be at least 1",
    },
  },
  STRING: {
    REGEX: {
      value: /^[a-zA-Z0-9_.\- ]+$/,
      message: "String must contain only letters, numbers, spaces, hyphens, underscores and periods",
    },
  },
  MONTH: {
    REGEX: {
      value: /^(?:[1-9]|1[0-2])$/,
      message: "Month must be between 1 and 12",
    },
    MIN: {
      value: 1,
      message: "Month must be at least 1",
    },
    MAX: {
      value: 12,
      message: "Month must be at most 12",
    },
  },
  DAY: {
    REGEX: {
      value: /^(?:[1-9]|[12]\d|3[01])$/,
      message: "Day must be between 1 and 31",
    },
    MIN: {
      value: 1,
      message: "Day must be at least 1",
    },
    MAX: {
      value: 31,
      message: "Day must be at most 31",
    },
  },
  POSTAL_CODE: {
    REGEX: {
      value: /^\d{4}$/,
      message: "Postal code must be 4 digits",
    },
  },
  PASSWORD: {
    MIN_LENGTH: {
      value: 8,
      message: "Password must be at least 8 characters long",
    },
    MAX_LENGTH: {
      value: 120,
      message: "Password must be at most 120 characters long",
    },
    REGEX: {
      value: /^.{8,120}$/,
      message: "Password must be at least 8 characters long",
    },
  },
};
