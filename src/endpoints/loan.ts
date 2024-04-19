import { Data, Constr, toUnit } from "lucid-cardano";
import { LoanConfig } from "../core/global.types.ts";
import { getLucid } from "../core/utils/utils.ts";
import { AssetClassD, CollateralDatum } from "../core/contract.types.ts";
import { getValidators } from "../core/scripts.ts";

export async function loanTx(loanConfig: LoanConfig) {
  try {
    const lucid = await getLucid();

    const { loanValidator, collateralValidator, loanStakingValidator } =
      await getValidators();
    const collateralValidatorAddress =
      lucid.utils.validatorToAddress(collateralValidator);

    const loanUnit = loanConfig.loanAsset.policyId
      ? toUnit(loanConfig.loanAsset.policyId, loanConfig.loanAsset.tokenName)
      : "lovelace";

    const collateralAsset: AssetClassD = {
      policyId: loanConfig.collateralAsset.policyId,
      tokenName: loanConfig.collateralAsset.tokenName,
    };

    const interestAsset: AssetClassD = {
      policyId: loanConfig.interestAsset.policyId,
      tokenName: loanConfig.interestAsset.tokenName,
    };

    const loanAsset: AssetClassD = {
      policyId: loanConfig.loanAsset.policyId,
      tokenName: loanConfig.loanAsset.tokenName,
    };

    const loanRedeemer = Data.to(new Constr(0, []));

    const tx = lucid.newTx();
    tx.collectFrom(loanConfig.loanUTxOs, loanRedeemer)
      .attachSpendingValidator(loanValidator)
      .attachWithdrawalValidator(loanStakingValidator);

    for (let i = 0; i < loanConfig.collateralUTxOsInfo.length; i++) {
      const collateralDatum: CollateralDatum = {
        loanAsset: loanAsset,
        loanAmount: BigInt(loanConfig.collateralUTxOsInfo[i].loanAmount),
        collateralAsset: collateralAsset,
        interestAsset: interestAsset,
        interestAmount: BigInt(
          loanConfig.collateralUTxOsInfo[i].interestAmount
        ),
        loanDuration: BigInt(loanConfig.collateralUTxOsInfo[i].loanDuration),
        lendTime: BigInt(loanConfig.lendTime),
        lenderPubKeyHash: loanConfig.collateralUTxOsInfo[i].lenderPubKeyHash,
        totalInterestAmount: BigInt(loanConfig.total_interest_amount),
        totalLoanAmount: BigInt(loanConfig.total_loan_amount),
        borrowerPubKeyHash: loanConfig.borrowerPubKeyHash,
      };

      tx.payToContract(
        collateralValidatorAddress,
        { inline: Data.to(collateralDatum, CollateralDatum) },
        {
          [loanUnit]: BigInt(
            loanConfig.collateralUTxOsInfo[i].collateralAmount
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
