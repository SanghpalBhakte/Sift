import { useEffect, useRef, useState } from "react";
import {
  EMPTY_SUBSCRIPTION_FORM,
} from "@/lib/subscriptions/constants";
import { mapSubscriptionRowToForm } from "@/lib/subscriptions/mappers";
import type {
  SubscriptionFormValues,
  SubscriptionWithRelations,
} from "@/lib/subscriptions/types";

export function useSubscriptionForm(params: {
  mode: "create" | "edit";
  subscription?: SubscriptionWithRelations | null;
}) {
  const { mode, subscription } = params;
  const [form, setForm] = useState<SubscriptionFormValues>(EMPTY_SUBSCRIPTION_FORM);
  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!subscription) return;
    if (initializedForId.current === subscription.id) return;

    setForm(mapSubscriptionRowToForm(subscription));
    initializedForId.current = subscription.id;
  }, [mode, subscription]);

  useEffect(() => {
    if (mode === "create") {
      initializedForId.current = null;
      setForm(EMPTY_SUBSCRIPTION_FORM);
    }
  }, [mode]);

  function setField<K extends keyof SubscriptionFormValues>(
    key: K,
    value: SubscriptionFormValues[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm(next?: SubscriptionWithRelations | null) {
    if (next) {
      initializedForId.current = next.id;
      setForm(mapSubscriptionRowToForm(next));
      return;
    }

    initializedForId.current = null;
    setForm(EMPTY_SUBSCRIPTION_FORM);
  }

  return {
    form,
    setForm,
    setField,
    resetForm,
  };
}
