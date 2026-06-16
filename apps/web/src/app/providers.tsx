"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState, type ReactNode } from "react";
import { AuthSync } from "@/components/auth/auth-sync";
import { TopProgress } from "@/components/top-progress";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <Suspense fallback={null}>
        <TopProgress />
      </Suspense>
      <AuthSync />
      {children}
    </QueryClientProvider>
  );
}
