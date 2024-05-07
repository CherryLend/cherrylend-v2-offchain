import { Data, Constr, Lucid } from "lucid-cardano";
import {
  getValidators,
  getValidityRange,
  LiquidateCollateralConfig,
} from "../core/index.js";

export async function liquidateLoanTx(
  lucid: Lucid,
  liquidateCollateral: LiquidateCollateralConfig
) {
  try {
    const { collateralValidator } = await getValidators();

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(0, [1n])])])
    );

    const { validFrom, validTo } = getValidityRange(
      lucid,
      liquidateCollateral.now
    );

    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(liquidateCollateral.collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
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
