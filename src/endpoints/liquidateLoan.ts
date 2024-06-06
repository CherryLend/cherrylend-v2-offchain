import { Data, Constr, Lucid } from "lucid-cardano";
import {
  getValidators,
  getValidityRange,
  LiquidateLoanConfig,
} from "../core/index.js";

export async function liquidateLoanTx(
  lucid: Lucid,
  liquidateLoan: LiquidateLoanConfig
) {
  try {
    const { collateralValidator } = await getValidators(lucid);

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(0, [""])])])
    );

    const { validFrom, validTo } = getValidityRange(lucid, liquidateLoan.now);

    const collateralUTxOs = await lucid.utxosByOutRef(
      liquidateLoan.requestOutRefs
    );

    const tx = lucid.newTx();
    const completedTx = await tx
      .collectFrom(collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
      .addSignerKey(liquidateLoan.lenderPubKeyHash)
      .validFrom(validFrom)
      .validTo(validTo)
      .compose(
        liquidateLoan.service && liquidateLoan.service.fee > 0
          ? lucid.newTx().payToAddress(liquidateLoan.service.address, {
              lovelace: BigInt(liquidateLoan.service.fee),
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
