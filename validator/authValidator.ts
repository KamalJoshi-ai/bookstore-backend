import { z } from "zod";

const passwordSchema = z
  .string()
  .min(
    6,
    "Password must be at least 6 characters"
  )
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

export const registerSchema =
  z.object({
    body: z.object({
      name: z
        .string()
        .trim()
        .min(
          2,
          "Name must be at least 2 characters"
        )
        .max(
          50,
          "Name must be less than 50 characters"
        ),

      email: z
        .string()
        .trim()
        .email(
          "Please enter a valid email address"
        ),

      password: passwordSchema,

      isSeller: z
        .boolean()
        .optional()
        .default(false),
    }),
  });

export const loginSchema =
  z.object({
    body: z.object({
      email: z
        .string()
        .trim()
        .email(
          "Please enter a valid email address"
        ),

      password: passwordSchema,
    }),
  });