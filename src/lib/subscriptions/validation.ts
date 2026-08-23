import { z } from "zod";

const optionalDate = z
  .string()
  .nullable()
  .refine((value) => value == null || value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Date must be YYYY-MM-DD",
  })
  .transform((value) => (value && value.trim() ? value : null));

export const subscriptionFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((value) => !Number.isNaN(Number(value)), "Amount must be a number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  currency: z.string().trim().min(1, "Currency is required"),
  billingCycle: z.enum(["monthly", "yearly"]),
  nextBillingDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  categoryId: z.string().uuid().nullable(),
  paymentMethodId: z.string().uuid().nullable(),
  description: z.string(),
  notes: z.string(),
  isActive: z.boolean(),
  status: z.enum(["active", "paused", "cancelled", "trial"]),
  trialEndsOn: optionalDate,
  cancellationEffectiveDate: optionalDate,
  monthlyAlternativePrice: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === "" || !Number.isNaN(Number(value)), {
      message: "Monthly alternative price must be a number",
    }),
});

export type SubscriptionFormSchema = z.infer<typeof subscriptionFormSchema>;
