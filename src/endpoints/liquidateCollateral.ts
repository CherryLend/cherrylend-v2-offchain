import { Data, Constr, Lucid } from "lucid-cardano";
import { getValidityRange, LiquidateCollateralConfig } from "../core/index.js";

export async function liquidateCollateralTx(
  lucid: Lucid,
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(0, [1n])])])
    );
    const { validFrom, validTo } = getValidityRange();
    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(liquidateCollateral.collateralUTxOs, redeemer)
      .attachSpendingValidator(liquidateCollateral.collateralValidator)
      .addSignerKey(liquidateCollateral.lenderPubKeyHash)
      .validFrom(validFrom)
      .validTo(validTo)
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
