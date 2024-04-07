import { Data, Constr, SpendingValidator } from "lucid-cardano";
import { GetInterestConfig } from "..";
import { getLucid } from "@/core/utils";

export async function getInterest(getInterestConfig: GetInterestConfig) {
  try {
    const lucid = await getLucid();
    const validator: SpendingValidator = {
      type: "PlutusV2",
      script: getInterestConfig.interestScript,
    };

    const tx = lucid.newTx();
    const getInterestRedeemer = Data.to(new Constr(0, [1n]));
    const completedTx = await tx
      .collectFrom(getInterestConfig.UTXOs, getInterestRedeemer)
      .attachSpendingValidator(validator)
      .addSigner(getInterestConfig.pubKeyAddress)
      .complete();

    return completedTx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
