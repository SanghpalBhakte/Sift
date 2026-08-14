'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center p-1 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg">
      <button
        type="button"
        onClick={() => setTheme('paper-ledger')}
        title="Paper Ledger (Light)"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
          theme === 'paper-ledger'
            ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        )}
      >
        <Sun className="w-3.5 h-3.5" />
        {showLabels ? 'Paper Ledger' : null}
      </button>
      <button
        type="button"
        onClick={() => setTheme('night-shelf')}
        title="Night Shelf (Dark)"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
          theme === 'night-shelf'
            ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        )}
      >
        <Moon className="w-3.5 h-3.5" />
        {showLabels ? 'Night Shelf' : null}
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        title="System Auto"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
          theme === 'system'
            ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs border border-[hsl(var(--border))]'
            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
        )}
      >
        <Laptop className="w-3.5 h-3.5" />
        {showLabels ? 'Auto' : null}
      </button>
    </div>
  );
}
