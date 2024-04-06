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
      .addSigner(await lucid.wallet.address())
      .complete();

    return completedTx;
  } catch (e) {
    console.log(e);
  }
}
