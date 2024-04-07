import { getLucid } from "../core/utils/utils.ts";
import { AssetClassD, OfferLoanDatum } from "../core/contract.types.ts";
import { Data, SpendingValidator, toUnit } from "lucid-cardano";
import { OfferLoanConfig } from "../core/global.types.ts";

export async function offerLoan(offerLoanConfig: OfferLoanConfig) {
  try {
    const loanUnit = offerLoanConfig.loanAsset.policyId
      ? toUnit(
          offerLoanConfig.loanAsset.policyId,
          offerLoanConfig.loanAsset.tokenName
        )
      : "lovelace";

    const loanAmountInEachUTXO = offerLoanConfig.loanAmount / 10;
    // Min Token Amount needs to be higher than 10 or else it will fail
    // because collateral amount will not be a whole number
    if (loanUnit === "lovelace" && loanAmountInEachUTXO < 1000000) {
      throw new Error("Amount too low");
    } else if (loanAmountInEachUTXO < 10) {
      throw new Error("Amount too low");
    }

    const validator: SpendingValidator = {
      type: "PlutusV2",
      script: offerLoanConfig.loanScript,
    };

    const collateralAmount =
      (loanAmountInEachUTXO * offerLoanConfig.collateralPercentage) / 100;
    const interestAmount = loanAmountInEachUTXO * offerLoanConfig.apr;

    const lucid = await getLucid();

    const tempscriptAddress = lucid.utils.validatorToAddress(validator);

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
        collateralAmount: BigInt(collateralAmount),
        interestAsset: interestAsset,
        interestAmount: BigInt(interestAmount),
        loanAsset: loanAsset,
        loanAmount: BigInt(loanAmountInEachUTXO),
        loanDuration: BigInt(offerLoanConfig.loanDuration),
        loanOwnerPubKeyHash: offerLoanConfig.pubKeyHash,
      };

      tx.payToContract(
        tempscriptAddress,
        { inline: Data.to(offerLoanDatum, OfferLoanDatum) },
        {
          lovelace: BigInt(loanAmountInEachUTXO),
        }
      );
    }

    return tx;
  } catch (error) {
    if (error instanceof Error) return { type: "error", error: error };

    return { type: "error", error: new Error(`${JSON.stringify(error)}`) };
  }
}
