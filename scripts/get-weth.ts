import hre from "hardhat";
import { type Address, parseEther } from "viem";

const AMOUNT = parseEther("0.02");

export const getWeth = async () => {
  const { viem } = await hre.network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();
  const walletAddress = walletClient.account.address;

  const contract = await viem.getContractAt(
    "IWeth",
    process.env.MAINNET_WETH_CONTRACT_ADDRESS as Address,
    { client: { wallet: walletClient } },
  );

  const hash = await contract.write.deposit({ value: AMOUNT });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Received WETH! Transaction hash: ${receipt.transactionHash}`);

  const wethBalance = await contract.read.balanceOf([walletAddress]);
  console.log(`WETH balance: ${wethBalance} (in wei)`);
};
