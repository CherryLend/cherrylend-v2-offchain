import { Data, Constr, SpendingValidator } from "lucid-cardano";
import { CancelLoanConfig } from "..";
import { getLucid } from "@/core/utils";

export async function getCancelLoanTx(cancelLoanConfig: CancelLoanConfig) {
  try {
    const lucid = await getLucid();
    const validator: SpendingValidator = {
      type: "PlutusV2",
      script: cancelLoanConfig.loanScript,
    };

    const tx = lucid.newTx();
    const cancelLoanRedeemer = Data.to(new Constr(1, []));
    const completedTx = await tx
      .collectFrom(cancelLoanConfig.UTXOs, cancelLoanRedeemer)
      .attachSpendingValidator(validator)
      .addSigner(await lucid.wallet.address())
      .complete();

    return completedTx;
  } catch (e) {
    console.log(e);
  }
}
