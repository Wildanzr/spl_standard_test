import {
  Connection,
  PublicKey,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createBurnCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import secret from "../wallets/owner.json";

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const MINT_ADDRESS = "CJetGYPULK6eRAncjbESH5Q23wnATNmQ8ByUNRPjUoDB";
const MINT_DECIMALS = 9;

const burnToken = async (amount: number) => {
  const SOLANA_CONNECTION = new Connection(clusterApiUrl("devnet"));

  // Step 1 - Fetch Associated Token Account Address
  console.log(`Step 1 - Fetch Token Account`);
  const account = await getAssociatedTokenAddress(
    new PublicKey(MINT_ADDRESS),
    WALLET.publicKey
  );
  console.log(
    `    ✅ - Associated Token Account Address: ${account.toString()}`
  );

  // Step 2 - Create Burn Instructions
  console.log(`Step 2 - Create Burn Instructions`);
  const burnIx = createBurnCheckedInstruction(
    account, // PublicKey of Owner's Associated Token Account
    new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
    WALLET.publicKey, // Public Key of Owner's Wallet
    amount * 10 ** MINT_DECIMALS, // Number of tokens to burn
    MINT_DECIMALS // Number of Decimals of the Token Mint
  );
  console.log(`    ✅ - Burn Instruction Created`);

  // Step 3 - Fetch Blockhash
  console.log(`Step 3 - Fetch Blockhash`);
  const { blockhash, lastValidBlockHeight } =
    await SOLANA_CONNECTION.getLatestBlockhash("finalized");
  console.log(`    ✅ - Latest Blockhash: ${blockhash}`);

  // Step 4 - Assemble Transaction
  console.log(`Step 4 - Assemble Transaction`);
  const messageV0 = new TransactionMessage({
    payerKey: WALLET.publicKey,
    recentBlockhash: blockhash,
    instructions: [burnIx],
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([WALLET]);
  console.log(`    ✅ - Transaction Created and Signed`);

  // Step 5 - Execute & Confirm Transaction
  console.log(`Step 5 - Execute & Confirm Transaction`);
  const txid = await SOLANA_CONNECTION.sendTransaction(transaction);
  console.log("    ✅ - Transaction sent to network");
  const confirmation = await SOLANA_CONNECTION.confirmTransaction({
    signature: txid,
    blockhash: blockhash,
    lastValidBlockHeight: lastValidBlockHeight,
  });
  if (confirmation.value.err) {
    throw new Error("    ❌ - Transaction not confirmed.");
  }
  console.log(
    "🔥 SUCCESSFUL BURN!🔥",
    "\n",
    `https://explorer.solana.com/tx/${txid}?cluster=devnet`
  );
};

burnToken(2.5);
