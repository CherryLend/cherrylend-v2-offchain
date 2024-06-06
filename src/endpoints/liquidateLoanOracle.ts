import { Lucid, Data, toUnit, Constr, fromText } from "lucid-cardano";
import { LiquidateLoanOracleConfig } from "../core/global.types.js";
import { bytesToScript, getValidators, getValidityRange } from "../index.js";

export async function liquidateLoanOracleTx(
  lucid: Lucid,
  liquidateLoanOracleConfig: LiquidateLoanOracleConfig
) {
  const { collateralValidator } = await getValidators(lucid);

  const oraclePolicy = bytesToScript(
    liquidateLoanOracleConfig.oracleScript,
    "Native"
  );
  const oraclePolicyId = lucid.utils.mintingPolicyToId(oraclePolicy);

  const oracleTN = fromText("Oracle");

  const redeemer = Data.to(
    new Constr(1, [new Constr(0, [new Constr(0, [oracleTN])])])
  );

  const { validFrom, validTo } = getValidityRange(
    lucid,
    liquidateLoanOracleConfig.now
  );

  const collateralUTxOs = await lucid.utxosByOutRef(
    liquidateLoanOracleConfig.requestOutRefs
  );

  try {
    const tx = await lucid
      .newTx()
      .collectFrom(collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
      .mintAssets({ [toUnit(oraclePolicyId, oracleTN)]: 1n })
      .payToAddress(
        lucid.utils.validatorToAddress(
          oraclePolicy,
          lucid.utils.keyHashToCredential(liquidateLoanOracleConfig.stakeHash)
        ),
        { [toUnit(oraclePolicyId, oracleTN)]: 1n }
      )
      .attachMintingPolicy(oraclePolicy)
      .validFrom(validFrom)
      .validTo(validTo)
      .compose(
        liquidateLoanOracleConfig.service &&
          liquidateLoanOracleConfig.service.fee > 0
          ? lucid
              .newTx()
              .payToAddress(liquidateLoanOracleConfig.service.address, {
                lovelace: BigInt(liquidateLoanOracleConfig.service.fee),
              })
          : null
      )
      .complete();

    return { type: "success", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
