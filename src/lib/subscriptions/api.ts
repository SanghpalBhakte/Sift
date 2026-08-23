import { supabase } from "@/lib/supabase/client";
import { subscriptionSelect } from "@/lib/supabase/queries/subscriptions";
import {
  buildSubscriptionInsertPayload,
  buildSubscriptionUpdatePayload,
} from "./mappers";
import type { SubscriptionFormValues } from "./types";

export async function createSubscription(params: {
  userId: string;
  values: SubscriptionFormValues;
}) {
  const payload = buildSubscriptionInsertPayload(params);

  const { data, error } = await (supabase.from("subscriptions") as any)
    .insert(payload)
    .select(subscriptionSelect)
    .single();

  if (error) {
    console.error("Supabase subscription insert error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      operation: "createSubscription",
      payloadKeys: Object.keys(payload),
    });
    throw error;
  }

  return data;
}

export async function updateSubscription(params: {
  subscriptionId: string;
  userId: string;
  values: SubscriptionFormValues;
}) {
  const payload = buildSubscriptionUpdatePayload(params.values);

  const { data, error } = await (supabase.from("subscriptions") as any)
    .update(payload)
    .eq("id", params.subscriptionId)
    .eq("user_id", params.userId)
    .select(subscriptionSelect)
    .single();

  if (error) {
    console.error("Supabase subscription update error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      operation: "updateSubscription",
      payloadKeys: Object.keys(payload),
      subscriptionId: params.subscriptionId,
    });
    throw error;
  }

  return data;
}

export async function deleteSubscription(params: {
  subscriptionId: string;
  userId: string;
}) {
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", params.subscriptionId)
    .eq("user_id", params.userId);

  if (error) {
    console.error("Supabase subscription delete error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      operation: "deleteSubscription",
      subscriptionId: params.subscriptionId,
    });
    throw error;
  }
}
