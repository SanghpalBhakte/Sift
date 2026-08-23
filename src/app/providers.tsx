"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { showErrorToast } from "@/lib/toast/toast";

function getUserSafeErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    const message = (error as any).message;

    if (message.includes("violates foreign key constraint")) {
      return "That selection is no longer valid. Please choose again.";
    }

    if (message.includes("schema cache")) {
      return "Sweep is temporarily out of sync. Please try again shortly.";
    }

    return message;
  }

  return "Something went wrong. Please try again.";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            const skipToast = (mutation.options.meta as any)?.skipGlobalErrorToast;
            if (skipToast) return;
            showErrorToast(getUserSafeErrorMessage(error));
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#2a2221",
            color: "#f7efe7",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
