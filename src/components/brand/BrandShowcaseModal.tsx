'use client';

import React, { useState } from 'react';
import {
  LOGO_DIRECTIONS,
  LogoDirectionId,
  SweepLogoDirectionRenderer,
  SweepIconLedgerArc,
  SweepIconReceiptFold,
  SweepIconCadenceNotch,
  SweepIconMonogramCrest,
} from './SweepLogoDirections';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, Sparkles, Check, Copy, Smartphone, Layers, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BrandShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BrandShowcaseModal({ isOpen, onClose }: BrandShowcaseModalProps) {
  const [selectedDirection, setSelectedDirection] = useState<LogoDirectionId>('ledger-arc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentInfo = LOGO_DIRECTIONS.find((d) => d.id === selectedDirection)!;

  const handleCopyName = (id: string, name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="sweep-card max-w-4xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-primary/20 bg-card">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-surface/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Sweep Brand Identity · 4 Logo Directions
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio-worthy visual exploration tailored for calm recurring subscription management.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direction Switcher Tabs */}
        <div className="flex items-center gap-2 p-3 sm:px-6 border-b border-border bg-surface/20 overflow-x-auto no-scrollbar">
          {LOGO_DIRECTIONS.map((dir) => (
            <button
              key={dir.id}
              type="button"
              onClick={() => setSelectedDirection(dir.id)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2',
                selectedDirection === dir.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-surface border border-border'
              )}
            >
              <span>{dir.name.split(':')[1] || dir.name}</span>
              {selectedDirection === dir.id && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Large Showcase Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left: Interactive Canvas */}
            <div className="md:col-span-7 p-6 sm:p-8 rounded-2xl bg-surface/80 border border-border/80 flex flex-col items-center justify-center min-h-[260px] text-center space-y-6 relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>WARM LEDGER SURFACE</span>
                <span>FRAUNCES + INK PLUM</span>
              </div>

              {/* Main Lockup */}
              <div className="py-4">
                <SweepLogoDirectionRenderer
                  direction={selectedDirection}
                  size="hero"
                  showWordmark={true}
                  showTagline={true}
                />
              </div>

              {/* App Icon Mockup & Favicon Scale Preview */}
              <div className="w-full pt-4 border-t border-border/60 flex items-center justify-around gap-4">
                {/* iOS / PWA Squircle Mockup */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-md flex items-center justify-center p-3 transition-transform hover:scale-105">
                    {selectedDirection === 'ledger-arc' && <SweepIconLedgerArc size={30} />}
                    {selectedDirection === 'receipt-fold' && <SweepIconReceiptFold size={30} />}
                    {selectedDirection === 'cadence-notch' && <SweepIconCadenceNotch size={30} />}
                    {selectedDirection === 'monogram-crest' && <SweepIconMonogramCrest size={30} />}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">PWA Icon (64px)</span>
                </div>

                {/* Navbar Scale */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="px-3 py-1.5 rounded-lg bg-card border border-border shadow-2xs flex items-center gap-2">
                    <SweepLogoDirectionRenderer
                      direction={selectedDirection}
                      size="sm"
                      showWordmark={true}
                      showTagline={false}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Header (20px)</span>
                </div>

                {/* Favicon Scale */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-2xs flex items-center justify-center p-1">
                    {selectedDirection === 'ledger-arc' && <SweepIconLedgerArc size={16} />}
                    {selectedDirection === 'receipt-fold' && <SweepIconReceiptFold size={16} />}
                    {selectedDirection === 'cadence-notch' && <SweepIconCadenceNotch size={16} />}
                    {selectedDirection === 'monogram-crest' && <SweepIconMonogramCrest size={16} />}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Favicon (16px)</span>
                </div>
              </div>
            </div>

            {/* Right: Rationale & Design Anatomy */}
            <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Badge variant="primary" size="sm">
                    {currentInfo.subtitle}
                  </Badge>
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    {currentInfo.name}
                  </h3>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <div>
                    <strong className="text-foreground block mb-0.5">Core Concept:</strong>
                    {currentInfo.concept}
                  </div>
                  <div>
                    <strong className="text-foreground block mb-0.5">Metaphor & Story:</strong>
                    {currentInfo.metaphor}
                  </div>
                  <div>
                    <strong className="text-foreground block mb-0.5">Visual Hook:</strong>
                    {currentInfo.visualHook}
                  </div>
                  <div>
                    <strong className="text-foreground block mb-0.5">Ideal Portfolio Positioning:</strong>
                    {currentInfo.bestFor}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyName(currentInfo.id, currentInfo.name)}
                  className="w-full text-xs gap-1.5 justify-center"
                >
                  {copiedId === currentInfo.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === currentInfo.id ? 'Copied Direction Name' : 'Copy Direction Spec'}
                </Button>
              </div>
            </div>
          </div>

          {/* 4-Direction Comparative Overview Grid */}
          <div className="pt-4 border-t border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              All 4 Directions At A Glance
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LOGO_DIRECTIONS.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDirection(d.id)}
                  className={cn(
                    'p-4 rounded-xl border transition-all cursor-pointer space-y-3',
                    selectedDirection === d.id
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate">{d.name.split(':')[1] || d.name}</span>
                    {selectedDirection === d.id ? (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    ) : null}
                  </div>

                  <div className="py-2 flex items-center justify-center">
                    <SweepLogoDirectionRenderer
                      direction={d.id}
                      size="sm"
                      showWordmark={true}
                      showTagline={false}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {d.metaphor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface/50 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Color: Warm Ledger Parchment (#F6F1E8) · Deep Ink Plum (#5B294A)
          </span>
          <Button type="button" variant="primary" size="sm" onClick={onClose} className="text-xs">
            Done Reviewing
          </Button>
        </div>
      </div>
    </div>
  );
}
