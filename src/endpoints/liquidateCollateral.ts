import { Data, Constr, Lucid } from "lucid-cardano";
import { getValidityRange, LiquidateCollateralConfig } from "../core/index.js";

export async function liquidateCollateralTx(
  lucid: Lucid,
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const liquidateCollateraltRedeemer = Data.to(new Constr(1, [1n]));
    const { validFrom, validTo } = getValidityRange();
    const tx = lucid.newTx();
    await tx
      .collectFrom(
        liquidateCollateral.collateralUTxOs,
        liquidateCollateraltRedeemer
      )
      .attachSpendingValidator(liquidateCollateral.collateralValidator)
      .addSignerKey(liquidateCollateral.lenderPubKeyHash)
      .validFrom(validFrom)
      .validTo(validTo)
      .complete();

    return {
      type: "success",
      tx: tx,
    };
  } catch (error) {
    console.log(error);
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
