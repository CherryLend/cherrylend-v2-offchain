import { Blockfrost, Lucid } from "lucid-cardano";

const submitLoan = async (blockfrost: Blockfrost, lucid: Lucid, loan: any) => {
  // Submit loan
  const tx = await lucid.submitLoan(loan);

  // Wait for the transaction to be included in a block
  await blockfrost.waitForTx(tx.txHash);
};
