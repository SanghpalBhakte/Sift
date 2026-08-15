'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Subscription } from '@/lib/types';
import { SubscriptionCard } from './SubscriptionCard';
import { Button } from '../ui/Button';
import { Search, Plus, Layers, Sparkles, UploadCloud, RotateCcw } from 'lucide-react';
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
  const { categories, populateStarterTemplates } = useSubscriptions();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'trials' | 'candidates' | 'paused'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'next_renewal_date' | 'amount' | 'name'>('next_renewal_date');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('focusSearch') === 'true') {
        const input = document.getElementById('subscription-search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setActiveTab('all');
    setCategoryFilter('all');
    setSortBy('next_renewal_date');
  };

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

  // 1. Completely empty ledger state
  if (subscriptions.length === 0) {
    return (
      <div className="sift-card p-8 sm:p-10 text-center space-y-4 border-dashed">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--primary))] shadow-xs">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
            Your subscriptions ledger is empty
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto leading-relaxed">
            Add recurring software tools, streaming services, or import bank statements to track renewal schedules.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/subscriptions/new" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto gap-1.5 shadow-xs">
              <Plus className="w-4 h-4" />
              Add First Subscription
            </Button>
          </Link>
          <Link href="/subscriptions/import" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto gap-1.5 text-xs">
              <UploadCloud className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              Import Statement
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => populateStarterTemplates()}
            className="w-full sm:w-auto gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            Load Sample Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="subscription-search-input"
              type="text"
              placeholder="Search subscriptions, tools, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sift-input pl-9 pr-8"
            />
            <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center justify-center text-[10px] font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 pointer-events-none">
              /
            </kbd>
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
        /* 2. Filter Zero-State */
        <div className="sift-card p-8 sm:p-10 text-center space-y-3 border-dashed">
          <div className="w-10 h-10 mx-auto rounded-full bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            <Search className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              No subscriptions match your filter
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-xs mx-auto">
              {search.trim()
                ? `No active services found for "${search}".`
                : 'No services match the current category or status filter.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
            <Link href="/subscriptions/new">
              <Button variant="primary" size="sm" className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Subscription
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
