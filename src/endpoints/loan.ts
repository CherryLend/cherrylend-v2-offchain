import { Data, Tx, toUnit } from "lucid-cardano";
import { LoanConfig } from "../core/global.types.js";
import { getLucid } from "../core/utils/utils.js";
import { AssetClassD, CollateralDatum } from "../core/contract.types.js";
import { getValidators } from "../core/scripts.js";

export async function loanTx(loanConfig: LoanConfig) {
  try {
    const lucid = await getLucid();

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

    // const validFrom = loanConfig.lendTime - 120000;
    // const validTo = loanConfig.lendTime + 120000;

    const tx = lucid.newTx();
    tx.collectFrom(loanConfig.loanUTxOs, "")
      .attachSpendingValidator(loanConfig.loanValidator)
      .attachWithdrawalValidator(loanConfig.loanStakingValidator)
      .withdraw(loanConfig.loanStakingValidatorAddress, 0n, Data.to(1n));
    // .validFrom(validFrom)
    // .validTo(validTo);

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
        loanConfig.collateralScriptAddress,
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
