"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { lensTestnet, lens} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    chains: [lensTestnet,lens],
    transports: {

      [lensTestnet.id]: http(
        `https://lens-testnet.drpc.org`,
      ),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "TruthCast",
    appDescription: "TruthCast is a platform for creating and sharing videos about the truth.",
    appUrl: "https://family.co", 
    appIcon: "https://family.co/logo.png",
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};