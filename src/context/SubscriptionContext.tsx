import { createContext, useContext, useMemo, useState } from "react";
import { getFeatureMap, type FeatureKey, type UserState } from "@/lib/feature-flags";

interface SubscriptionContextValue {
  userState: UserState;
  features: Record<FeatureKey, boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [userState] = useState<UserState>("active");
  const features = useMemo(() => getFeatureMap(userState), [userState]);

  return (
    <SubscriptionContext.Provider value={{ userState, features }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
