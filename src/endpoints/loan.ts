import { Constr, Data, Lucid, toUnit } from "lucid-cardano";
import {
  getValidityRange,
  AssetClassD,
  CollateralDatum,
  LoanConfig,
  getValidators,
  getCollateralInfoFromLoan,
} from "../core/index.js";

export async function loanTx(lucid: Lucid, loanConfig: LoanConfig) {
  try {
    const {
      loanValidator,
      loanStakingValidator,
      loanRewardAddress,
      collateralScriptAddress,
    } = await getValidators(lucid);

    const loanUnit = loanConfig.loanAsset.policyId
      ? toUnit(loanConfig.loanAsset.policyId, loanConfig.loanAsset.name)
      : "lovelace";

    const collateralAsset: AssetClassD = {
      policyId: loanConfig.collateralAsset.policyId,
      name: loanConfig.collateralAsset.name,
    };

    const interestAsset: AssetClassD = {
      policyId: loanConfig.interestAsset.policyId,
      name: loanConfig.interestAsset.name,
    };

    const loanAsset: AssetClassD = {
      policyId: loanConfig.loanAsset.policyId,
      name: loanConfig.loanAsset.name,
    };

    const { validFrom, validTo } = getValidityRange(lucid, loanConfig.now);

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(1, [1n])])])
    );

    const loanUTxOs = await lucid.utxosByOutRef(loanConfig.requestOutRefs);

    const collateralUTxOsInfo = getCollateralInfoFromLoan(loanUTxOs);

    const tx = lucid
      .newTx()
      .collectFrom(loanUTxOs, redeemer)
      .attachSpendingValidator(loanValidator)
      .withdraw(loanRewardAddress, 0n, Data.to(1n))
      .attachWithdrawalValidator(loanStakingValidator)
      .validFrom(validFrom)
      .validTo(validTo);

    for (let i = 0; i < collateralUTxOsInfo.length; i++) {
      const collateralDatum: CollateralDatum = {
        loanAmount: BigInt(collateralUTxOsInfo[i].loanAmount),
        loanAsset: loanAsset,
        collateralAsset: collateralAsset,
        interestAmount: BigInt(collateralUTxOsInfo[i].interestAmount),
        interestAsset: interestAsset,
        loanDuration: BigInt(collateralUTxOsInfo[i].loanDuration),
        lendTime: BigInt(validFrom),
        lenderPubKeyHash: collateralUTxOsInfo[i].lenderPubKeyHash,
        totalInterestAmount: BigInt(loanConfig.totalInterestAmount),
        totalLoanAmount: BigInt(loanConfig.totalLoanAmount),
        borrowerPubKeyHash: loanConfig.borrowerPubKeyHash,
        liquidationPolicy: loanConfig.liquidationPolicy,
        collateralFactor: BigInt(loanConfig.collateralFactor),
      };

      // If it is a native asset loan, make sure the collateral contains the amount of ADA that the lender send when we split it
      if (loanUnit === "lovelace") {
        tx.payToContract(
          collateralScriptAddress,
          { inline: Data.to(collateralDatum, CollateralDatum) },
          {
            [loanUnit]: BigInt(collateralUTxOsInfo[i].collateralAmount),
          }
        );
      } else {
        tx.payToContract(
          collateralScriptAddress,
          { inline: Data.to(collateralDatum, CollateralDatum) },
          {
            [loanUnit]: BigInt(collateralUTxOsInfo[i].collateralAmount),
            lovelace: BigInt(collateralUTxOsInfo[i].lovelaceAmount),
          }
        );
      }
    }

    const completedTx = await tx
      .compose(
        loanConfig.service && loanConfig.service.fee > 0
          ? lucid.newTx().payToAddress(loanConfig.service.address, {
              lovelace: BigInt(loanConfig.service.fee),
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
