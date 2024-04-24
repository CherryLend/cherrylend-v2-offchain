import { getLucid } from "../core/utils/utils.ts";
import { AssetClassD, OfferLoanDatum } from "../core/contract.types.ts";
import { Data, toUnit } from "lucid-cardano";
import { OfferLoanConfig } from "../core/global.types.ts";

export async function loanOfferTx(offerLoanConfig: OfferLoanConfig) {
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

    const loanUnit = offerLoanConfig.loanAsset.policyId
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

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
