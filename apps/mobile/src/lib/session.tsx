import { createEdgeEverClient } from "@edgeever/client";
import type { AuthUser } from "@edgeever/shared";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const SESSION_KEY = "edgeever.mobile.session";
const DEVICE_ID_KEY = "edgeever.mobile.device-id";

const getOrCreateDeviceId = async () => {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const randomPart = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const deviceId = `mobile-${Date.now().toString(36)}-${randomPart}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

export type MobileSession = {
  baseUrl: string;
  token: string;
  user: AuthUser | null;
};

type SessionContextValue = {
  isLoading: boolean;
  session: MobileSession | null;
  client: ReturnType<typeof createEdgeEverClient> | null;
  signIn: (input: { baseUrl: string; username: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<MobileSession | null>(null);

  useEffect(() => {
    let mounted = true;

    SecureStore.getItemAsync(SESSION_KEY)
      .then((value) => {
        if (!mounted || !value) {
          return;
        }

        setSession(JSON.parse(value) as MobileSession);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const client = useMemo(() => {
    if (!session) {
      return null;
    }

    return createEdgeEverClient({
      baseUrl: session.baseUrl,
      token: session.token,
      onUnauthorized: () => {
        queryClient.clear();
        setSession(null);
        void SecureStore.deleteItemAsync(SESSION_KEY);
      },
    });
  }, [queryClient, session]);

  const signIn = useCallback(async (input: { baseUrl: string; username: string; password: string }) => {
    const baseUrl = normalizeInstanceUrl(input.baseUrl);
    const deviceId = await getOrCreateDeviceId();
    const loginClient = createEdgeEverClient({ baseUrl });
    const authSession = await loginClient.login({
      username: input.username,
      password: input.password,
      deviceId,
    });

    if (!authSession.authenticated || !authSession.sessionToken) {
      throw new Error("Sign-in succeeded but the server did not return a mobile session. Verify the server is updated to a version that supports app sign-in.");
    }

    const nextSession: MobileSession = {
      baseUrl,
      token: authSession.sessionToken,
      user: authSession.user,
    };

    queryClient.clear();
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (client) {
      await client.logout().catch(() => undefined);
    }

    queryClient.clear();
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
  }, [client, queryClient]);

  const value = useMemo(
    () => ({
      isLoading,
      session,
      client,
      signIn,
      signOut,
    }),
    [client, isLoading, session, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
};

const normalizeInstanceUrl = (value: string) => {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
};
