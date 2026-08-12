import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { hasPermission, type Permission, type Role } from "./roles";

export type Session = {
  userId: string | null;
  displayName: string | null;
  role: Role;
};

export const ANONYMOUS_SESSION: Session = { userId: null, displayName: null, role: "guest" };

type AuthContextValue = {
  session: Session;
  isAuthenticated: boolean;
  setSession: (session: Session) => void;
  signOut: () => void;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Contenitore di sessione. L'integrazione reale (login/token) si innesta qui. */
export function AuthProvider({
  children,
  initialSession = ANONYMOUS_SESSION,
}: {
  children: ReactNode;
  initialSession?: Session;
}) {
  const [session, setSession] = useState<Session>(initialSession);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session.userId !== null,
      setSession,
      signOut: () => setSession(ANONYMOUS_SESSION),
      can: (permission) => hasPermission(session.role, permission),
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
