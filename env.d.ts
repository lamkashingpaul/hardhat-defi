declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TZ: "UTC";
      NODE_ENV: NodeJS.ProcessEnv;

      SEPOLIA_RPC_URL: string;
      SEPOLIA_PRIVATE_KEY: string;

      SEPOLIA_WETH_CONTRACT_ADDRESS: string;
      MAINNET_WETH_CONTRACT_ADDRESS: string;
    }
  }
}
export {};
