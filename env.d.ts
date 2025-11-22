declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TZ: "UTC";
      NODE_ENV: NodeJS.ProcessEnv;

      SEPOLIA_RPC_URL: string;
      SEPOLIA_PRIVATE_KEY: string;
      SEPOLIA_WETH_CONTRACT_ADDRESS: string;

      MAINNET_RPC_URL: string;
      MAINNET_WETH_CONTRACT_ADDRESS: string;
      MAINNET_AAVE_POOL_ADDRESS_PROVIDER_ADDRESS: string;
    }
  }
}
export {};
