"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <div>Missing Privy App ID – check .env.local</div>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["farcaster"],
        appearance: { theme: "dark" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}