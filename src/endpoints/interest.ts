import { Data, Constr, Lucid } from "lucid-cardano";
import { InterestConfig } from "../core/global.types.js";

export async function interestTx(
  lucid: Lucid,
  getInterestConfig: InterestConfig
) {
  try {
    const getInterestRedeemer = Data.to(new Constr(0, [1n]));

    const tx = lucid.newTx();
    await tx
      .collectFrom(getInterestConfig.interestUTxOs, getInterestRedeemer)
      .attachSpendingValidator(getInterestConfig.interestValidator)
      .addSignerKey(getInterestConfig.lenderPubKeyHash)
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
