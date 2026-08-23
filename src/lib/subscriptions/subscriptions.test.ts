import { describe, it, expect } from "vitest";
import {
  mapCategoryToOption,
  mapPaymentMethodToOption,
  mapSubscriptionRowToDisplay,
  mapSubscriptionRowToForm,
  buildSubscriptionInsertPayload,
  buildSubscriptionUpdatePayload,
} from "./mappers";
import { subscriptionFormSchema } from "./validation";
import type { SubscriptionRow, SubscriptionWithRelations } from "./types";

describe("Typed Subscription Data Layer", () => {
  it("maps category and payment method rows to options", () => {
    const catOption = mapCategoryToOption({
      id: "10000000-0000-0000-0000-000000000001",
      name: "Software & Dev",
      slug: "software-dev",
      color: "moss",
      icon: "terminal",
      user_id: null,
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(catOption.value).toBe("10000000-0000-0000-0000-000000000001");
    expect(catOption.label).toBe("Software & Dev");

    const pmOption = mapPaymentMethodToOption({
      id: "20000000-0000-0000-0000-000000000001",
      name: "Credit Card",
      type: "credit_card",
      user_id: "user-123",
      last4: "4242",
      color: null,
      is_default: true,
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(pmOption.value).toBe("20000000-0000-0000-0000-000000000001");
    expect(pmOption.label).toBe("Credit Card (•••• 4242)");
  });

  it("maps subscription row to display object with fallback labels", () => {
    const row: SubscriptionRow = {
      id: "sub-1",
      user_id: "user-1",
      name: "ChatGPT Plus",
      description: "AI assistant",
      notes: "Work expense",
      amount: 20,
      currency: "USD",
      billing_cycle: "monthly",
      custom_interval_days: null,
      status: "active",
      category_id: null,
      payment_method_id: null,
      start_date: "2026-01-01",
      next_renewal_date: "2026-09-01",
      is_trial: false,
      trial_end_date: null,
      reminder_offsets: [3, 1],
      value_rating: "essential",
      cancel_url: null,
      monthly_amount: 20,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const display = mapSubscriptionRowToDisplay(row);
    expect(display.categoryName).toBe("None / Unassigned");
    expect(display.paymentMethodName).toBe("None / Unassigned");
    expect(display.amount).toBe(20);
  });

  it("maps subscription with embedded relations to display object", () => {
    const rowWithRelations: SubscriptionWithRelations = {
      id: "sub-2",
      user_id: "user-1",
      name: "Cursor Pro",
      description: null,
      notes: null,
      amount: 20,
      currency: "USD",
      billing_cycle: "monthly",
      custom_interval_days: null,
      status: "active",
      category_id: "10000000-0000-0000-0000-000000000001",
      payment_method_id: "20000000-0000-0000-0000-000000000001",
      start_date: "2026-01-01",
      next_renewal_date: "2026-09-01",
      is_trial: false,
      trial_end_date: null,
      reminder_offsets: [3, 1],
      value_rating: "essential",
      cancel_url: null,
      monthly_amount: 20,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      category: {
        id: "10000000-0000-0000-0000-000000000001",
        name: "Software & Dev",
        slug: "software-dev",
        color: "moss",
        icon: "terminal",
      },
      payment_method: {
        id: "20000000-0000-0000-0000-000000000001",
        name: "Credit Card",
        type: "credit_card",
        last4: "4242",
        color: null,
        is_default: true,
      },
    };

    const display = mapSubscriptionRowToDisplay(rowWithRelations);
    expect(display.categoryName).toBe("Software & Dev");
    expect(display.paymentMethodName).toBe("Credit Card (•••• 4242)");
    expect(display.categoryId).toBe("10000000-0000-0000-0000-000000000001");
  });

  it("builds subscription insert and update payloads with normalized nulls", () => {
    const insertPayload = buildSubscriptionInsertPayload({
      userId: "user-123",
      values: {
        name: "Spotify",
        amount: "119",
        currency: "INR",
        billingCycle: "monthly",
        nextBillingDate: "2026-09-01",
        categoryId: "",
        paymentMethodId: "",
        description: "",
        notes: "",
        isActive: true,
        status: "active",
        trialEndsOn: null,
        cancellationEffectiveDate: null,
        monthlyAlternativePrice: "",
      },
    });

    expect(insertPayload.category_id).toBeNull();
    expect(insertPayload.payment_method_id).toBeNull();
    expect(insertPayload.description).toBeNull();
    expect(insertPayload.amount).toBe(119);

    const updatePayload = buildSubscriptionUpdatePayload({
      name: "Spotify Duo",
      amount: "149",
      currency: "INR",
      billingCycle: "monthly",
      nextBillingDate: "2026-09-01",
      categoryId: "10000000-0000-0000-0000-000000000004",
      paymentMethodId: "20000000-0000-0000-0000-000000000001",
      description: "Updated plan",
      notes: "",
      isActive: true,
      status: "active",
      trialEndsOn: null,
      cancellationEffectiveDate: null,
      monthlyAlternativePrice: "",
    });

    expect(updatePayload.category_id).toBe("10000000-0000-0000-0000-000000000004");
    expect(updatePayload.payment_method_id).toBe("20000000-0000-0000-0000-000000000001");
    expect(updatePayload.amount).toBe(149);
  });

  it("validates form schema successfully with zod", () => {
    const valid = subscriptionFormSchema.safeParse({
      name: "Apple Music",
      amount: "99",
      currency: "INR",
      billingCycle: "monthly",
      nextBillingDate: "2026-09-10",
      categoryId: "11111111-1111-4111-8111-111111111111",
      paymentMethodId: null,
      description: "Music streaming",
      notes: "",
      isActive: true,
      status: "active",
      trialEndsOn: null,
      cancellationEffectiveDate: null,
      monthlyAlternativePrice: "",
    });

    expect(valid.success).toBe(true);
  });
});
