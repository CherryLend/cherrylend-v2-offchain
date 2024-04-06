import { getLucid } from "@/core/utils";
import { Data, Constr } from "lucid-cardano";
import { loanScript } from "..";

//
export async function getCancelLoanTx(cancelLoanConfig: CancelLoanConfig) {
  try {
    const lucid = await getLucid();
    lucid.selectWallet(walletApi);
    const scriptAddress = lucid.utils.validatorToAddress(loanScript);
    const scriptUtxos = await lucid.utxosAt(scriptAddress);
    const tx = lucid.newTx();
    const burnRedeemer = Data.to(new Constr(1, []));
    const completedTx = await tx
      .collectFrom([scriptUtxos[0]], burnRedeemer)
      .attachSpendingValidator(loanScript)
      .addSigner(await lucid.wallet.address())
      .complete();

    return completedTx;
  } catch (e) {
    console.log(e);
  }
}
