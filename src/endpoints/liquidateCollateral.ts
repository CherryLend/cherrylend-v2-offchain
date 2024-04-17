import { Data, Constr } from "lucid-cardano";
import { LiquidateCollateralConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";
import { getParamertizedCollateralValidator } from "../core/scripts.ts";

export async function liquidateCollateralTx(
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const lucid = await getLucid();
    const validator = await getParamertizedCollateralValidator();

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
