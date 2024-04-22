import { Data, Constr } from "lucid-cardano";
import { CancelLoanConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";
import { getValidators } from "../core/scripts.ts";

export async function cancelLoanTx(cancelLoanConfig: CancelLoanConfig) {
  try {
    const lucid = await getLucid();

    const { loanValidator } = await getValidators();

    const newCancelRedeemer = Data.to(new Constr(1, [1n]));
    const tx = lucid.newTx();
    tx.collectFrom(cancelLoanConfig.loanUTxOs, newCancelRedeemer)
      .attachSpendingValidator(loanValidator)
      .addSignerKey(cancelLoanConfig.lenderPubKeyHash);

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
