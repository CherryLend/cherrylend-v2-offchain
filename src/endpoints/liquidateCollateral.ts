import { Data, Constr } from "lucid-cardano";
import { LiquidateCollateralConfig } from "../core/global.types.js";
import { getLucid } from "../core/utils/utils.js";

export async function liquidateCollateralTx(
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const lucid = await getLucid();

    const liquidateCollateraltRedeemer = Data.to(new Constr(1, [1n]));

    const tx = lucid.newTx();
    tx.collectFrom(
      liquidateCollateral.collateralUTxOs,
      liquidateCollateraltRedeemer
    )
      .attachSpendingValidator(liquidateCollateral.collateralValidator)
      .addSignerKey(liquidateCollateral.lenderPubKeyHash);

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
