import type {
  ContractReturnType,
  WalletClient,
} from "@nomicfoundation/hardhat-viem/types";
import hre from "hardhat";
import type { NetworkConnection } from "hardhat/types/network";
import { type Address, formatUnits } from "viem";
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

  const { totalCollateralBase, availableBorrowsBase, totalDebtBase } =
    await getBorrowUserData(poolContract, walletClient.account.address);
  const { ethUsdPrice, decimalsForEthUsdPrice } =
    await getEthUsdPrice(connection);
  const { daiEthPrice, decimalsForDaiEthPrice } =
    await getDaiEthPrice(connection);

  // Calculate USD/DAI rate: (USD/ETH) * (ETH/DAI) = USD/DAI
  // Price has decimalsForEthUsdPrice + decimalsForDaiEthPrice decimals
  const usdPerDai = ethUsdPrice * daiEthPrice;

  // Convert availableBorrowsBase (USD with 8 decimals) to DAI (with 18 decimals)
  // Formula: (amount * 10^X) / price, where X makes the decimals work out
  // Input: 8 decimals, Price: (decimalsForEthUsdPrice + decimalsForDaiEthPrice) decimals, Output: 18 decimals
  // 8 + X - (decimalsForEthUsdPrice + decimalsForDaiEthPrice) = 18
  // X = 10 + decimalsForEthUsdPrice + decimalsForDaiEthPrice
  const DAI_DECIMALS = 18;
  const AAVE_BASE_DECIMALS = 8;
  const decimalAdjustment = BigInt(
    DAI_DECIMALS +
      decimalsForEthUsdPrice +
      decimalsForDaiEthPrice -
      AAVE_BASE_DECIMALS,
  );
  const daiAmountToBorrow =
    (availableBorrowsBase * 10n ** decimalAdjustment) / usdPerDai;

  console.log(`Available to borrow: ${formatUnits(daiAmountToBorrow, 18)} DAI`);
};

const getEthUsdPrice = async (connection: NetworkConnection) => {
  const ethUsdPriceFeedContract = await connection.viem.getContractAt(
    "AggregatorV3Interface",
    process.env.MAINNET_ETH_USD_PRICE_FEED_ADDRESS as Address,
  );
  const decimals = await ethUsdPriceFeedContract.read.decimals();
  const latestRoundData = await ethUsdPriceFeedContract.read.latestRoundData();
  const ethUsdPrice = latestRoundData[1];
  console.log(
    `ETH/USD price from Chainlink: ${ethUsdPrice} (with ${decimals} decimals)`,
  );
  return { ethUsdPrice, decimalsForEthUsdPrice: decimals };
};

const getDaiEthPrice = async (connection: NetworkConnection) => {
  const daiEthPriceFeedContract = await connection.viem.getContractAt(
    "AggregatorV3Interface",
    process.env.MAINNET_DAI_ETH_PRICE_FEED_ADDRESS as Address,
  );
  const decimals = await daiEthPriceFeedContract.read.decimals();
  const latestRoundData = await daiEthPriceFeedContract.read.latestRoundData();
  const daiEthPrice = latestRoundData[1];
  console.log(
    `DAI/ETH price from Chainlink: ${daiEthPrice} (with ${decimals} decimals)`,
  );
  return { daiEthPrice, decimalsForDaiEthPrice: decimals };
};

const getBorrowUserData = async (
  poolContract: ContractReturnType<"IPool">,
  userAddress: Address,
) => {
  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor,
  ] = await poolContract.read.getUserAccountData([userAddress]);
  console.log(`Total Collateral (in Base Currency): ${totalCollateralBase}`);
  console.log(`Total Debt (in Base Currency): ${totalDebtBase}`);
  console.log(`Available Borrows (in Base Currency): ${availableBorrowsBase}`);
  console.log(`Current Liquidation Threshold: ${currentLiquidationThreshold}`);
  console.log(`Loan to Value (LTV): ${ltv}`);
  console.log(`Health Factor: ${healthFactor}`);

  return {
    totalCollateralBase,
    availableBorrowsBase,
    totalDebtBase,
  };
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
