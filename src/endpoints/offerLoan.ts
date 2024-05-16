import { Data, Lucid, toUnit } from "lucid-cardano";
import {
  OfferLoanConfig,
  AssetClassD,
  OfferLoanDatum,
  getValidators,
  splitLoanAmount,
  minLovelaceAmount,
} from "../core/index.js";

export async function offerLoanTx(
  lucid: Lucid,
  offerLoanConfig: OfferLoanConfig
) {
  try {
    const { loanScriptAddress } = await getValidators(lucid);

    const collateralAsset: AssetClassD = {
      policyId: offerLoanConfig.collateralAsset.policyId,
      tokenName: offerLoanConfig.collateralAsset.tokenName,
    };

    const interestAsset: AssetClassD = {
      policyId: offerLoanConfig.interestAsset.policyId,
      tokenName: offerLoanConfig.interestAsset.tokenName,
    };

    const loanAsset: AssetClassD = {
      policyId: offerLoanConfig.loanAsset.policyId,
      tokenName: offerLoanConfig.loanAsset.tokenName,
    };

    const loanUnit =
      offerLoanConfig.loanAsset.policyId.length > 0
        ? toUnit(
            offerLoanConfig.loanAsset.policyId,
            offerLoanConfig.loanAsset.tokenName
          )
        : "lovelace";

    const loanUTXoSAmount = splitLoanAmount(
      offerLoanConfig.totalLoanAmount,
      offerLoanConfig.amountInEachUTxO
    );

    const tx = lucid.newTx();

    for (let i = 0; i < loanUTXoSAmount.length; i++) {
      const offerLoanDatum: OfferLoanDatum = {
        loanAmount: BigInt(loanUTXoSAmount[i]),
        loanAsset: loanAsset,
        collateralAmount: BigInt(offerLoanConfig.collateralAmount),
        collateralAsset: collateralAsset,
        interestAmount: BigInt(offerLoanConfig.interestAmount),
        interestAsset: interestAsset,
        loanDuration: BigInt(offerLoanConfig.loanDuration),
        lenderPubKeyHash: offerLoanConfig.lenderPubKeyHash,
        liquidationPolicy: offerLoanConfig.liquidationPolicy,
        collateral_factor: BigInt(offerLoanConfig.collateral_factor),
      };

      if (loanUnit === "lovelace") {
        tx.payToContract(
          loanScriptAddress,
          { inline: Data.to(offerLoanDatum, OfferLoanDatum) },
          {
            [loanUnit]: BigInt(loanUTXoSAmount[i]),
          }
        );
      } else {
        tx.payToContract(
          loanScriptAddress,
          { inline: Data.to(offerLoanDatum, OfferLoanDatum) },
          {
            [loanUnit]: BigInt(loanUTXoSAmount[i]),
            lovelace: BigInt(minLovelaceAmount),
          }
        );
      }
    }

    const completedTx = await tx
      .compose(
        offerLoanConfig.service && offerLoanConfig.service.fee > 0
          ? lucid.newTx().payToAddress(offerLoanConfig.service.address, {
              lovelace: BigInt(offerLoanConfig.service.fee),
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
