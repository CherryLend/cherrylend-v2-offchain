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
    const { collateralValidator } = await getValidators(lucid);

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(0, [""])])])
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
      .compose(
        liquidateCollateral.service && liquidateCollateral.service.fee > 0
          ? lucid.newTx().payToAddress(liquidateCollateral.service.address, {
              lovelace: BigInt(liquidateCollateral.service.fee),
            })
          : null
      )
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
