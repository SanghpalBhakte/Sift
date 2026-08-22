'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils/cn';

export interface AuthShellProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  cardClassName?: string;
  showHeaderLogo?: boolean;
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  icon,
  className,
  cardClassName,
  showHeaderLogo = true,
}: AuthShellProps) {
  return (
    <div className={cn('w-full max-w-md mx-auto space-y-5', className)}>
      {showHeaderLogo ? (
        <div className="flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs transition-transform group-hover:scale-105">
              S
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Sift
            </span>
          </Link>
          <ThemeToggle />
        </div>
      ) : null}

      <Card className={cn('sift-card shadow-lg border-border', cardClassName)}>
        {(title || description || icon) ? (
          <CardHeader className="text-center flex-col items-center justify-center gap-1.5 pb-2">
            {icon ? (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
                {icon}
              </div>
            ) : null}
            {title ? (
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                {title}
              </CardTitle>
            ) : null}
            {description ? (
              <CardDescription className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {description}
              </CardDescription>
            ) : null}
          </CardHeader>
        ) : null}

        <CardContent className="pt-2">
          {children}
        </CardContent>

        {footer ? (
          <CardFooter className="justify-center text-xs text-muted-foreground">
            {footer}
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
