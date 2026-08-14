'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Subscription, SubscriptionFilters, ValueRating } from '@/lib/types';
import { SubscriptionCard } from './SubscriptionCard';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Search, Plus, SlidersHorizontal, Layers, Sparkles } from 'lucide-react';
import { useSubscriptions } from '@/context/SubscriptionContext';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onDelete?: (id: string) => void;
}

export function SubscriptionList({
  subscriptions,
  onToggleStatus,
  onDelete,
}: SubscriptionListProps) {
  const { categories } = useSubscriptions();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'trials' | 'candidates' | 'paused'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'next_renewal_date' | 'amount' | 'name'>('next_renewal_date');

  // Filter subscriptions
  const filtered = subscriptions.filter((sub) => {
    // Search
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const matchName = sub.name.toLowerCase().includes(q);
      const matchDesc = sub.description?.toLowerCase().includes(q);
      const matchCat = sub.category?.name.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    // Tabs
    if (activeTab === 'active' && sub.status !== 'active') return false;
    if (activeTab === 'trials' && (!sub.is_trial || sub.status !== 'active')) return false;
    if (activeTab === 'candidates' && (sub.value_rating !== 'cancel_candidate' || sub.status !== 'active')) return false;
    if (activeTab === 'paused' && sub.status !== 'paused') return false;

    // Category
    if (categoryFilter !== 'all' && sub.category_id !== categoryFilter) return false;

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'next_renewal_date') {
      return new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime();
    }
    if (sortBy === 'amount') {
      return b.amount - a.amount;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search subscriptions, tools, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sift-input pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="sift-input text-xs py-2 px-3 w-auto min-w-[130px]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="sift-input text-xs py-2 px-3 w-auto min-w-[130px]"
            >
              <option value="next_renewal_date">Sort: Next Renewal</option>
              <option value="amount">Sort: Cost (High to Low)</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Items', count: subscriptions.length },
            { id: 'active', label: 'Active', count: subscriptions.filter((s) => s.status === 'active').length },
            { id: 'trials', label: 'Free Trials', count: subscriptions.filter((s) => s.is_trial && s.status === 'active').length },
            { id: 'candidates', label: 'Cancel Candidates', count: subscriptions.filter((s) => s.value_rating === 'cancel_candidate' && s.status === 'active').length },
            { id: 'paused', label: 'Paused', count: subscriptions.filter((s) => s.status === 'paused').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] shadow-xs font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1 rounded bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted-foreground))]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subscription Cards List */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="sift-card p-10 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              No subscriptions match your filter
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Try adjusting your search criteria or add a new recurring item.
            </p>
          </div>
          <Link href="/subscriptions/new" className="inline-block pt-1">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Subscription
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
