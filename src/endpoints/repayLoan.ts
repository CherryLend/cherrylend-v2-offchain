import { Data, Constr, toUnit, Lucid } from "lucid-cardano";
import {
  AssetClassD,
  InterestDatum,
  RepayLoanConfig,
  getInterestInfoFromCollateral,
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
    } = await getValidators(lucid);

    const loanUnit = repayLoanConfig.loanAsset.policyId
      ? toUnit(
          repayLoanConfig.loanAsset.policyId,
          repayLoanConfig.loanAsset.name
        )
      : "lovelace";

    const interestAsset: AssetClassD = {
      policyId: repayLoanConfig.interestAsset.policyId,
      name: repayLoanConfig.interestAsset.name,
    };

    const loanAsset: AssetClassD = {
      policyId: repayLoanConfig.loanAsset.policyId,
      name: repayLoanConfig.loanAsset.name,
    };

    const redeemer = Data.to(
      new Constr(1, [new Constr(0, [new Constr(1, [1n])])])
    );

    const { validFrom, validTo } = getValidityRange(lucid, repayLoanConfig.now);

    const collateralUTxOs = await lucid.utxosByOutRef(
      repayLoanConfig.requestOutRefs
    );

    const interestUTxOsInfo = getInterestInfoFromCollateral(collateralUTxOs);

    const tx = lucid.newTx();
    tx.collectFrom(collateralUTxOs, redeemer)
      .attachSpendingValidator(collateralValidator)
      .withdraw(collateralRewardAddress, 0n, Data.to(1n))
      .attachWithdrawalValidator(collateralStakingValidator)
      .validFrom(validFrom)
      .validTo(validTo)
      .addSignerKey(repayLoanConfig.borrowerPubKeyHash);

    for (let i = 0; i < interestUTxOsInfo.length; i++) {
      const interestDatum: InterestDatum = {
        repayLoanAmount: BigInt(interestUTxOsInfo[i].repayLoanAmount),
        repayLoanAsset: loanAsset,
        repayInterestAmount: BigInt(interestUTxOsInfo[i].repayInterestAmount),
        repayInterestAsset: interestAsset,
        lenderPubKeyHash: interestUTxOsInfo[i].lenderPubKeyHash,
      };

      if (loanUnit === "lovelace") {
        tx.payToContract(
          interestScriptAddress,
          { inline: Data.to(interestDatum, InterestDatum) },
          {
            [loanUnit]: BigInt(
              interestUTxOsInfo[i].repayLoanAmount +
                interestUTxOsInfo[i].repayInterestAmount
            ),
          }
        );
      } else {
        tx.payToContract(
          interestScriptAddress,
          { inline: Data.to(interestDatum, InterestDatum) },
          {
            [loanUnit]: BigInt(
              interestUTxOsInfo[i].repayLoanAmount +
                interestUTxOsInfo[i].repayInterestAmount
            ),
            lovelace: BigInt(interestUTxOsInfo[i].lovelaceAmount),
          }
        );
      }
    }

    const completedTx = await tx
      .compose(
        repayLoanConfig.service && repayLoanConfig.service.fee > 0
          ? lucid.newTx().payToAddress(repayLoanConfig.service.address, {
              lovelace: BigInt(repayLoanConfig.service.fee),
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
