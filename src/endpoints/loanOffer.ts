import { getLucid } from "../core/utils/utils.ts";
import { AssetClassD, OfferLoanDatum } from "../core/contract.types.ts";
import { Data, toUnit } from "lucid-cardano";
import { OfferLoanConfig } from "../core/global.types.ts";
import { getParamertizedLoanValidator } from "../core/scripts.ts";

export async function offerLoanTx(offerLoanConfig: OfferLoanConfig) {
  try {
    const loanUnit = offerLoanConfig.loanAsset.policyId
      ? toUnit(
          offerLoanConfig.loanAsset.policyId,
          offerLoanConfig.loanAsset.tokenName
        )
      : "lovelace";
    // TODO: Add Params for loan amount in each UTXO
    const loanAmountInEachUTXO = offerLoanConfig.loanAmount / 10;

    const validator = await getParamertizedLoanValidator();

    const lucid = await getLucid();

    const loanScriptAddress = lucid.utils.validatorToAddress(validator);

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

    const tx = lucid.newTx();
    for (let i = 0; i < 10; i++) {
      const offerLoanDatum: OfferLoanDatum = {
        collateralAsset: collateralAsset,
        collateralAmount: BigInt(offerLoanConfig.collateralAmount),
        interestAsset: interestAsset,
        interestAmount: BigInt(offerLoanConfig.interestAmount),
        loanAsset: loanAsset,
        loanAmount: BigInt(loanAmountInEachUTXO),
        loanDuration: BigInt(offerLoanConfig.loanDuration),
        lenderPubKeyHash: offerLoanConfig.lenderPubKeyHash,
      };

      tx.payToContract(
        loanScriptAddress,
        { inline: Data.to(offerLoanDatum, OfferLoanDatum) },
        {
          [loanUnit]: BigInt(loanAmountInEachUTXO),
        }
      );
    }

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
