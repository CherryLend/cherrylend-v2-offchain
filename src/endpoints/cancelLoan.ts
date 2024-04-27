import { Data, Constr, Lucid } from "lucid-cardano";
import { CancelLoanConfig } from "../core/index.js";

export async function cancelLoanTx(
  lucid: Lucid,
  cancelLoanConfig: CancelLoanConfig
) {
  try {
    const newCancelRedeemer = Data.to(new Constr(1, [1n]));
    const tx = lucid.newTx();
    await tx
      .collectFrom(cancelLoanConfig.loanUTxOs, newCancelRedeemer)
      .attachSpendingValidator(cancelLoanConfig.loanValidator)
      .addSignerKey(cancelLoanConfig.lenderPubKeyHash)
      .complete();

    return {
      type: "success",
      tx: tx,
    };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
