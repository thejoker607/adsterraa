import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const promotionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(500).optional(),
  url: z.string().url("Must be a valid URL").refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "URL must use http or https"
  ),
  targetImpressions: z
    .number()
    .int()
    .min(100, "Minimum 100 impressions")
    .max(100000, "Maximum 100,000 impressions"),
});

export const adminPromotionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(500).optional(),
  url: z.string().url("Must be a valid URL").refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "URL must use http or https"
  ),
  targetImpressions: z.number().int().min(1, "At least 1 impression"),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminAccountUpdateSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
    email: z.string().email("Invalid email").optional(),
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .optional(),
  })
  .refine((data) => data.name || data.email || data.newPassword, {
    message: "Change at least one field (name, email, or password)",
  });

export const coinAdjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  reason: z.string().min(3).max(200),
});

export const configUpdateSchema = z.object({
  coin_rewards: z
    .object({
      daily_login: z.number().int().min(0),
      referral: z.number().int().min(0),
      runner_view: z.number().int().min(0),
      platform_task: z.number().int().min(0),
    })
    .optional(),
  campaign_pricing: z
    .object({
      coins_per_100_impressions: z.number().int().min(1),
    })
    .optional(),
  cooldowns: z
    .object({
      free_minutes: z.number().int().min(0),
      tier1_minutes: z.number().int().min(0),
      tier2_minutes: z.number().int().min(0),
    })
    .optional(),
  runner: z
    .object({
      view_seconds: z.number().int().min(10).max(60),
      min_view_seconds: z.number().int().min(5).max(30),
    })
    .optional(),
});

export const runnerStartSchema = z.object({
  sessionSize: z.union([z.literal(20), z.literal(30), z.literal(60)]),
});

export const reportSchema = z.object({
  promotionId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
export type AdminPromotionInput = z.infer<typeof adminPromotionSchema>;
