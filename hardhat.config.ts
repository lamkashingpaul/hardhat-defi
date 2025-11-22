import "dotenv/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";
import type { Address } from "viem";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL as Address;
const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY as Address;
const mainnetRpcUrl = process.env.MAINNET_RPC_URL as Address;

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: {
    compilers: [{ version: "0.8.33" }, { version: "0.4.19" }],
  },
  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    mainnetFork: {
      type: "edr-simulated",
      forking: {
        url: mainnetRpcUrl,
      },
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: sepoliaRpcUrl,
      accounts: [sepoliaPrivateKey],
      chainId: 11155111,
    },
  },
});
