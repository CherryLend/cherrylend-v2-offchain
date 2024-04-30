import { Data, Constr, Lucid } from "lucid-cardano";
import { CancelLoanConfig } from "../core/index.js";

export async function cancelLoanTx(
  lucid: Lucid,
  cancelLoanConfig: CancelLoanConfig
) {
  try {
    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(0, [1n])])])
    );
    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(cancelLoanConfig.loanUTxOs, redeemer)
      .attachSpendingValidator(cancelLoanConfig.loanValidator)
      .addSignerKey(cancelLoanConfig.lenderPubKeyHash)
      .complete();

    return {
      type: "success",
      tx: completedTx,
    };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
