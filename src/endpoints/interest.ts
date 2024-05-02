import { Data, Constr, Lucid } from "lucid-cardano";
import { InterestConfig, getValidators } from "../core/index.js";

export async function interestTx(
  lucid: Lucid,
  getInterestConfig: InterestConfig
) {
  try {
    const { interestValidator } = await getValidators();

    const getInterestRedeemer = Data.to(new Constr(0, [1n]));

    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(getInterestConfig.interestUTxOs, getInterestRedeemer)
      .attachSpendingValidator(interestValidator)
      .addSignerKey(getInterestConfig.lenderPubKeyHash)
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
