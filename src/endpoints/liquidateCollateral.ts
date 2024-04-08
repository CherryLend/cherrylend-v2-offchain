import { Data, Constr, SpendingValidator } from "lucid-cardano";
import { LiquidateCollateralConfig } from "..";
import { getLucid } from "@/core/utils";

export async function liquidateCollateral(
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const lucid = await getLucid();
    const validator: SpendingValidator = {
      type: "PlutusV2",
      script: liquidateCollateral.collateralScript,
    };

    const tx = lucid.newTx();
    const liquidateCollateraltRedeemer = Data.to(new Constr(1, []));
    const completedTx = await tx
      .collectFrom(liquidateCollateral.UTXOs, liquidateCollateraltRedeemer)
      .attachSpendingValidator(validator)
      .addSigner(liquidateCollateral.pubKeyAddress)
      .complete();

    return completedTx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
