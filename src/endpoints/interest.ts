import { Data, Constr } from "lucid-cardano";
import { GetInterestConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";
import { getValidators } from "@/core/scripts.ts";

export async function interestTx(getInterestConfig: GetInterestConfig) {
  try {
    const lucid = await getLucid();
    const { interestValidator } = await getValidators();

    const tx = lucid.newTx();
    const getInterestRedeemer = Data.to(new Constr(0, [1n]));
    const completedTx = await tx
      .collectFrom(getInterestConfig.UTXOs, getInterestRedeemer)
      .attachSpendingValidator(interestValidator)
      .addSigner(getInterestConfig.pubKeyAddress)
      .complete();

    return completedTx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
