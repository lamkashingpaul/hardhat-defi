import type { WalletClient } from "@nomicfoundation/hardhat-viem/types";
import hre from "hardhat";
import type { NetworkConnection } from "hardhat/types/network";
import type { Address } from "viem";
import { AMOUNT, getWeth } from "./get-weth.js";

const main = async () => {
  const connection = await hre.network.connect();
  const { viem } = connection;
  const [walletClient] = await viem.getWalletClients();

  await getWeth(connection);

  const poolContract = await getPoolContract(walletClient, connection);
  console.log(`Pool contract address: ${poolContract.address}`);

  await approveErc20(
    process.env.MAINNET_WETH_CONTRACT_ADDRESS as Address,
    poolContract.address,
    walletClient.account.address,
    AMOUNT,
    connection,
  );

  console.log(`Depositing WETH into Aave...`);
  await poolContract.write.deposit([
    process.env.MAINNET_WETH_CONTRACT_ADDRESS as Address,
    AMOUNT,
    walletClient.account.address,
    0,
  ]);
  console.log(`Deposited WETH into Aave!`);
};

const getPoolContract = async (
  ownerWallet: WalletClient,
  connection: NetworkConnection,
) => {
  const { viem } = connection;
  const poolAddressProviderContract = await viem.getContractAt(
    "IPoolAddressesProvider",
    process.env.MAINNET_AAVE_POOL_ADDRESS_PROVIDER_ADDRESS as Address,
    { client: { wallet: ownerWallet } },
  );

  const poolAddress = await poolAddressProviderContract.read.getPool();
  const poolContract = await viem.getContractAt("IPool", poolAddress, {
    client: { wallet: ownerWallet },
  });

  return poolContract;
};

const approveErc20 = async (
  erc20Address: Address,
  spender: Address,
  owner: Address,
  amount: bigint,
  connection: NetworkConnection,
) => {
  const { viem } = connection;
  const ownerWallet = await viem.getWalletClient(owner);
  const publicClient = await viem.getPublicClient();
  const erc20Contract = await viem.getContractAt("IERC20", erc20Address, {
    client: { wallet: ownerWallet },
  });

  const hash = await erc20Contract.write.approve([spender, amount]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(
    `Approved ${amount} tokens for ${spender}. Transaction hash: ${hash}`,
  );
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
