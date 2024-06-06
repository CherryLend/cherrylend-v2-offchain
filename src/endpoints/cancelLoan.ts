import { Data, Constr, Lucid } from "lucid-cardano";
import { CancelLoanConfig, getValidators } from "../core/index.js";

export async function cancelLoanTx(
  lucid: Lucid,
  cancelLoanConfig: CancelLoanConfig
) {
  try {
    const { loanValidator } = await getValidators(lucid);

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(0, [1n])])])
    );

    const loanUTxOs = await lucid.utxosByOutRef(
      cancelLoanConfig.requestOutRefs
    );

    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(loanUTxOs, redeemer)
      .attachSpendingValidator(loanValidator)
      .addSignerKey(cancelLoanConfig.lenderPubKeyHash)
      .compose(
        cancelLoanConfig.service && cancelLoanConfig.service.fee > 0
          ? lucid.newTx().payToAddress(cancelLoanConfig.service.address, {
              lovelace: BigInt(cancelLoanConfig.service.fee),
            })
          : null
      )
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
