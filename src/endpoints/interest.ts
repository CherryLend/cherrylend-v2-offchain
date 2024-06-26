import { Data, Constr, Lucid } from "lucid-cardano";
import { InterestConfig, getValidators } from "../core/index.js";

export async function interestTx(
  lucid: Lucid,
  getInterestConfig: InterestConfig
) {
  try {
    const { interestValidator } = await getValidators(lucid);

    const redeemer = Data.to(new Constr(0, [1n]));

    const interestUTxOs = await lucid.utxosByOutRef(
      getInterestConfig.requestOutRefs
    );

    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(interestUTxOs, redeemer)
      .attachSpendingValidator(interestValidator)
      .addSignerKey(getInterestConfig.lenderPubKeyHash)
      .compose(
        getInterestConfig.service && getInterestConfig.service.fee > 0
          ? lucid.newTx().payToAddress(getInterestConfig.service.address, {
              lovelace: BigInt(getInterestConfig.service.fee),
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
