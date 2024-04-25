import { getLucid } from "../core/utils/utils.js";
import { AssetClassD, OfferLoanDatum } from "../core/contract.types.js";
import { OfferLoanConfig } from "../core/global.types.js";
import { Data, toUnit } from "lucid-cardano";

export async function offerLoanTx(offerLoanConfig: OfferLoanConfig) {
  try {
    const lucid = await getLucid();

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

    const tx = lucid.newTx();
    for (let i = 0; i < offerLoanConfig.loanUTXoSAmount.length; i++) {
      const offerLoanDatum: OfferLoanDatum = {
        loanAmount: BigInt(offerLoanConfig.loanUTXoSAmount[i]),
        loanAsset: loanAsset,
        collateralAmount: BigInt(offerLoanConfig.collateralAmount),
        collateralAsset: collateralAsset,
        interestAmount: BigInt(offerLoanConfig.interestAmount),
        interestAsset: interestAsset,
        loanDuration: BigInt(offerLoanConfig.loanDuration),
        lenderPubKeyHash: offerLoanConfig.lenderPubKeyHash,
      };

      tx.payToContract(
        offerLoanConfig.loanScriptAddress,
        { inline: Data.to(offerLoanDatum, OfferLoanDatum) },
        {
          [loanUnit]: BigInt(offerLoanConfig.loanUTXoSAmount[i]),
        }
      );
    }

    tx.complete();
    return {
      type: "success",
      tx: tx,
    };
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
