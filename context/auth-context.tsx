"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { migrateIndexedDbToConvex } from "@/lib/migrate-indexeddb-to-convex";
import { clearDataset } from "@/lib/storage";

export interface AuthUser {
  _id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthBridge({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const user = useQuery(
    api.queries.getCurrentUser.default,
    isAuthenticated ? {} : "skip",
  );

  const migratedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || migratedRef.current) return;
    migratedRef.current = true;
    migrateIndexedDbToConvex().catch((err) => {
      console.error("indexeddb → convex migration failed", err);
    });
  }, [isAuthenticated]);

  const signIn = useCallback(async () => {
    await convexSignIn("google");
  }, [convexSignIn]);

  const signOut = useCallback(async () => {
    // Drop local cached dataset so the next user on this device starts clean.
    await clearDataset().catch(() => {});
    await convexSignOut();
  }, [convexSignOut]);

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthBridge>{children}</AuthBridge>
    </ConvexAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
