import { PAGINATION } from "utils/constants";
import { VALIDATION_RULES } from "utils/validation";
import z from "zod";

export const PageSchema = z
  .union([
    z.number().min(VALIDATION_RULES.PAGINATION.MIN_PAGE.value, VALIDATION_RULES.PAGINATION.MIN_PAGE.message),
    z.undefined(),
    z.null(),
  ])
  .transform((value) => value ?? PAGINATION.DEFAULT_PAGE);

export const LimitSchema = z
  .union([
    z.number().min(VALIDATION_RULES.PAGINATION.MIN_LIMIT.value, VALIDATION_RULES.PAGINATION.MIN_LIMIT.message),
    z.undefined(),
    z.null(),
  ])
  .transform((value) => value ?? PAGINATION.DEFAULT_LIMIT);
