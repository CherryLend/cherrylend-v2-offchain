import { Lucid, Data, toUnit, Constr, fromText } from "lucid-cardano";
import { LiquidateLoanOracleConfig } from "../core/global.types.js";
import { bytesToScript, getValidators, getValidityRange } from "../index.js";

export async function liquidateLoanOracleTx(
  lucid: Lucid,
  liquidateLoanOracleConfig: LiquidateLoanOracleConfig
) {
  const { collateralValidator } = await getValidators();

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

  try {
    const tx = await lucid
      .newTx()
      .collectFrom(liquidateLoanOracleConfig.collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
      .mintAssets({ [toUnit(oraclePolicyId, oracleTN)]: 1n })
      .payToAddress(
        lucid.utils.validatorToAddress(
          oraclePolicy,
          lucid.utils.keyHashToCredential(
            "93c550e1b3946e398c74806b5c133ff52ab021183e2a8be2a80caa06"
          )
        ),
        { [toUnit(oraclePolicyId, oracleTN)]: 1n }
      )
      .attachMintingPolicy(oraclePolicy)
      .validFrom(validFrom)
      .validTo(validTo)
      .complete();

    return { type: "success", data: tx };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
