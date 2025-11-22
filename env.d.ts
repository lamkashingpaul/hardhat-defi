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
      MAINNET_DAI_ETH_PRICE_FEED_ADDRESS: string;
      MAINNET_ETH_USD_PRICE_FEED_ADDRESS: string;
    }
  }
}
export {};
