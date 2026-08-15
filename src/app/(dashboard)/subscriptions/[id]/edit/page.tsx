'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionFormData } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <div className="space-y-4 max-w-2xl mx-auto py-4">
        <div className="h-6 w-40 bg-[hsl(var(--surface-muted))] rounded-md animate-pulse" />
        <div className="sift-card p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
          Subscription not found
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs mx-auto">
          The requested item may have been removed or does not exist in your active ledger.
        </p>
        <div className="pt-2">
          <Link
            href="/subscriptions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to subscriptions
          </Link>
        </div>
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
