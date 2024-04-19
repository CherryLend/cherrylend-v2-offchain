import { Data, Constr, toUnit } from "lucid-cardano";
import { RepayLoanConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";
import { AssetClassD, InterestDatum } from "../core/contract.types.ts";
import { getValidators } from "../core/scripts.ts";

export async function repayLoanTx(interestConfig: RepayLoanConfig) {
  try {
    const lucid = await getLucid();

    const {
      collateralValidator,
      collateralStakingValidator,
      interestValidator,
    } = await getValidators();
    const interestValidatorAddress =
      lucid.utils.validatorToAddress(interestValidator);

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

    const redeemer = Data.to(new Constr(0, []));

    const tx = lucid.newTx();
    tx.collectFrom(interestConfig.collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
      .attachWithdrawalValidator(collateralStakingValidator);

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
        interestValidatorAddress,
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

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
