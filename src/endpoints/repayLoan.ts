import { Data, Constr, toUnit, Lucid } from "lucid-cardano";
import { AssetClassD, InterestDatum, RepayLoanConfig } from "../core/index.js";

export async function repayLoanTx(
  lucid: Lucid,
  interestConfig: RepayLoanConfig
) {
  try {
    const loanUnit = interestConfig.loanAsset.policyId
      ? toUnit(
          interestConfig.loanAsset.policyId,
          interestConfig.loanAsset.tokenName
        )
      : "lovelace";

    const interestUnit = interestConfig.interestAsset.policyId
      ? toUnit(
          interestConfig.interestAsset.policyId,
          interestConfig.interestAsset.tokenName
        )
      : "lovelace";

    const interestAsset: AssetClassD = {
      policyId: interestConfig.interestAsset.policyId,
      tokenName: interestConfig.interestAsset.tokenName,
    };

    const loanAsset: AssetClassD = {
      policyId: interestConfig.loanAsset.policyId,
      tokenName: interestConfig.loanAsset.tokenName,
    };

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(1, [1n])])])
    );

    const tx = lucid.newTx();
    tx.collectFrom(interestConfig.collateralUTxOs, redeemer)
      .attachSpendingValidator(interestConfig.collateralValidator)
      .attachWithdrawalValidator(interestConfig.collateralStakingValidator);

    for (let i = 0; i < interestConfig.interestUTxOsInfo.length; i++) {
      const interestDatum: InterestDatum = {
        repayLoanAmount: BigInt(
          interestConfig.interestUTxOsInfo[i].repayLoanAmount
        ),
        repayLoanAsset: loanAsset,
        repayInterestAmount: BigInt(
          interestConfig.interestUTxOsInfo[i].repayInterestAmount
        ),
        repayInterestAsset: interestAsset,
        lenderPubKeyHash: interestConfig.interestUTxOsInfo[i].lenderPubKeyHash,
      };

      tx.payToContract(
        interestConfig.interestScriptAddress,
        { inline: Data.to(interestDatum, InterestDatum) },
        {
          [loanUnit]: BigInt(
            interestConfig.interestUTxOsInfo[i].repayLoanAmount
          ),
          [interestUnit]: BigInt(
            interestConfig.interestUTxOsInfo[i].repayInterestAmount
          ),
        }
      );
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
