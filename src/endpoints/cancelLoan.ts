import { Data, Constr } from "lucid-cardano";
import { CancelLoanConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";
import { getValidators } from "../core/scripts.ts";

export async function cancelLoanTx(cancelLoanConfig: CancelLoanConfig) {
  try {
    const lucid = await getLucid();
    const { loanValidator } = await getValidators();

    const tx = lucid.newTx();
    const cancelLoanRedeemer = Data.to(new Constr(1, []));
    const completedTx = tx
      .collectFrom(cancelLoanConfig.UTXOs, cancelLoanRedeemer)
      .attachSpendingValidator(loanValidator)
      .addSigner(cancelLoanConfig.pubKeyAddress);

    return completedTx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
