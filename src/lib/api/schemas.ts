import { z } from "zod";

const onboardingAnswer = z.object({
  questionId: z.string().min(1).max(32),
  optionId: z.string().min(1).max(32),
});

export const createAvatarSchema = z.object({
  choices: z.array(onboardingAnswer).length(3),
  freeText: z.string().trim().min(2).max(60),
  rebuild: z.boolean().optional().default(false),
});

export const renameAvatarSchema = z.object({ name: z.string().trim().min(1).max(12) });

export const dailyDateSchema = z.object({
  date: z.iso.date(),
  timezone: z.string().min(1).max(64),
});

export const rerollSchema = dailyDateSchema.extend({ currentQuestionId: z.string().min(1).max(32) });

export const dailyResponseSchema = dailyDateSchema.extend({
  questionId: z.string().min(1).max(32),
  answer: z.string().trim().min(1).max(60),
});

export const guestInteractionSchema = z.object({
  visitorId: z.uuid(),
  action: z.enum(["poke", "feed", "label"]),
});

export const shareExpirySchema = z.object({
  expiresInDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.null()]),
});
