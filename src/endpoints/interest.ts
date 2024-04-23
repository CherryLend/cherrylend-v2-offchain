import { Data, Constr } from "lucid-cardano";
import { InterestConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";

export async function interestTx(getInterestConfig: InterestConfig) {
  try {
    const lucid = await getLucid();

    const getInterestRedeemer = Data.to(new Constr(0, [1n]));

    const tx = lucid.newTx();
    tx.collectFrom(getInterestConfig.interestUTxOs, getInterestRedeemer)
      .attachSpendingValidator(getInterestConfig.interestValidator)
      .addSignerKey(getInterestConfig.lenderPubKeyHash)
      .complete();

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
