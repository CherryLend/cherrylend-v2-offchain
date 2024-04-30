import { Constr, Data, Lucid, toUnit } from "lucid-cardano";
import {
  getValidityRange,
  AssetClassD,
  CollateralDatum,
  LoanConfig,
} from "../core/index.js";

export async function loanTx(lucid: Lucid, loanConfig: LoanConfig) {
  try {
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

    const tx = lucid.newTx();

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(1, [1n])])])
    );

    const { validFrom, validTo } = getValidityRange();

    tx.collectFrom(loanConfig.loanUTxOs, redeemer)
      .attachSpendingValidator(loanConfig.loanValidator)
      .withdraw(loanConfig.loanStakingValidatorAddress, 0n, Data.to(1n))
      .attachWithdrawalValidator(loanConfig.loanStakingValidator)
      .validFrom(validFrom)
      .validTo(validTo);

    for (let i = 0; i < loanConfig.collateralUTxOsInfo.length; i++) {
      const collateralDatum: CollateralDatum = {
        loanAmount: BigInt(loanConfig.collateralUTxOsInfo[i].loanAmount),
        loanAsset: loanAsset,
        collateralAsset: collateralAsset,
        interestAmount: BigInt(
          loanConfig.collateralUTxOsInfo[i].interestAmount
        ),
        interestAsset: interestAsset,
        loanDuration: BigInt(loanConfig.collateralUTxOsInfo[i].loanDuration),
        lendTime: BigInt(validFrom),
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
