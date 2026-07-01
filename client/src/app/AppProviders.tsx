import type { PropsWithChildren } from "react";
import { ProgressProvider } from "../context/ProgressContext";
import { AuthProvider } from "../context/AuthContext";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </AuthProvider>
  );
}
