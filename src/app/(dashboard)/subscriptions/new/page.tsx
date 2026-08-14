'use client';

import React from 'react';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionFormData } from '@/lib/types';

export default function NewSubscriptionPage() {
  const { categories, paymentMethods, addSubscription } = useSubscriptions();

  const handleSubmit = async (data: SubscriptionFormData) => {
    await addSubscription(data);
  };

  return (
    <div className="py-2">
      <SubscriptionForm
        categories={categories}
        paymentMethods={paymentMethods}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
