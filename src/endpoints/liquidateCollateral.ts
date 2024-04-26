import { Data, Constr, Lucid } from "lucid-cardano";
import { LiquidateCollateralConfig } from "../core/global.types.js";

export async function liquidateCollateralTx(
  lucid: Lucid,
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const liquidateCollateraltRedeemer = Data.to(new Constr(1, [1n]));

    const tx = lucid.newTx();
    await tx
      .collectFrom(
        liquidateCollateral.collateralUTxOs,
        liquidateCollateraltRedeemer
      )
      .attachSpendingValidator(liquidateCollateral.collateralValidator)
      .addSignerKey(liquidateCollateral.lenderPubKeyHash)
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
