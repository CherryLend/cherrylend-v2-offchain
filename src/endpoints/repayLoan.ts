import { Data, Constr, toUnit, Lucid } from "lucid-cardano";
import {
  AssetClassD,
  InterestDatum,
  RepayLoanConfig,
  getValidators,
  getValidityRange,
} from "../core/index.js";

export async function repayLoanTx(
  lucid: Lucid,
  repayLoanConfig: RepayLoanConfig
) {
  try {
    const {
      interestScriptAddress,
      collateralValidator,
      collateralStakingValidator,
      collateralRewardAddress,
    } = await getValidators();

    const loanUnit = repayLoanConfig.loanAsset.policyId
      ? toUnit(
          repayLoanConfig.loanAsset.policyId,
          repayLoanConfig.loanAsset.tokenName
        )
      : "lovelace";

    const interestUnit = repayLoanConfig.interestAsset.policyId
      ? toUnit(
          repayLoanConfig.interestAsset.policyId,
          repayLoanConfig.interestAsset.tokenName
        )
      : "lovelace";

    console.log("loanUnit", interestUnit);

    const interestAsset: AssetClassD = {
      policyId: repayLoanConfig.interestAsset.policyId,
      tokenName: repayLoanConfig.interestAsset.tokenName,
    };

    const loanAsset: AssetClassD = {
      policyId: repayLoanConfig.loanAsset.policyId,
      tokenName: repayLoanConfig.loanAsset.tokenName,
    };

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(1, [1n])])])
    );

    const { validFrom, validTo } = getValidityRange(lucid, repayLoanConfig.now);

    const tx = lucid.newTx();
    tx.collectFrom(repayLoanConfig.collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
      .withdraw(collateralRewardAddress, 0n, Data.to(1n))
      .attachWithdrawalValidator(collateralStakingValidator)
      .validFrom(validFrom)
      .validTo(validTo)
      .addSignerKey(repayLoanConfig.borrowerPubKeyHash);

    for (let i = 0; i < repayLoanConfig.interestUTxOsInfo.length; i++) {
      const interestDatum: InterestDatum = {
        repayLoanAmount: BigInt(
          repayLoanConfig.interestUTxOsInfo[i].repayLoanAmount
        ),
        repayLoanAsset: loanAsset,
        repayInterestAmount: BigInt(
          repayLoanConfig.interestUTxOsInfo[i].repayInterestAmount
        ),
        repayInterestAsset: interestAsset,
        lenderPubKeyHash: repayLoanConfig.interestUTxOsInfo[i].lenderPubKeyHash,
      };

      if (loanUnit === interestUnit) {
        tx.payToContract(
          interestScriptAddress,
          { inline: Data.to(interestDatum, InterestDatum) },
          {
            [loanUnit]: BigInt(
              repayLoanConfig.interestUTxOsInfo[i].repayLoanAmount +
                repayLoanConfig.interestUTxOsInfo[i].repayInterestAmount
            ),
          }
        );
      } else {
        tx.payToContract(
          interestScriptAddress,
          { inline: Data.to(interestDatum, InterestDatum) },
          {
            [loanUnit]: BigInt(
              repayLoanConfig.interestUTxOsInfo[i].repayLoanAmount
            ),
            [interestUnit]: BigInt(
              repayLoanConfig.interestUTxOsInfo[i].repayInterestAmount
            ),
          }
        );
      }
    }

    const completedTx = await tx.complete();

    return {
      type: "success",
      tx: completedTx,
    };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
