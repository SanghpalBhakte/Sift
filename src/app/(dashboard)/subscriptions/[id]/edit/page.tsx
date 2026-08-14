'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionFormData } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const { subscriptions, categories, paymentMethods, updateSubscription, deleteSubscription, isLoading } =
    useSubscriptions();

  const subscription = subscriptions.find((s) => s.id === id);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-[hsl(var(--muted-foreground))]">
        Loading subscription details...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="py-12 text-center space-y-3">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Subscription not found
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          The requested item may have been deleted or does not exist.
        </p>
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--primary))] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to subscriptions
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: SubscriptionFormData) => {
    await updateSubscription(id, data);
  };

  const handleDelete = async (subId: string) => {
    await deleteSubscription(subId);
  };

  return (
    <div className="py-2">
      <SubscriptionForm
        initialData={subscription}
        categories={categories}
        paymentMethods={paymentMethods}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isEditing
      />
    </div>
  );
}
