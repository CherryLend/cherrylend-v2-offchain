import { getLucid } from "@/core/utils";
import { OfferLoanDatum } from "../core/contract.types";
import { Data, SpendingValidator, fromText } from "lucid-cardano";
import { OfferLoanConfig } from "..";

export async function offerLoan(offerLoanConfig: OfferLoanConfig) {
  const loanAmountInEachUTXO = offerLoanConfig.loanAmount / 10;
  //Min Token Amount needs to be higher than 10 or else it will fail
  //because collateral amount will not be a whole number
  if (
    offerLoanConfig.loanAsset === "lovelace" &&
    loanAmountInEachUTXO < 1000000
  ) {
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

  let tx = lucid.newTx();
  for (let i = 0; i < 10; i++) {
    const offerLoanDatum: OfferLoanDatum = {
      collateralAsset: fromText(offerLoanConfig.collateralAsset),
      collateralAmount: BigInt(collateralAmount),
      interestAsset: fromText(offerLoanConfig.interestAsset),
      interestAmount: BigInt(interestAmount),
      loanAsset: fromText(offerLoanConfig.loanAsset),
      loanAmount: BigInt(loanAmountInEachUTXO),
      loanDuration: BigInt(offerLoanConfig.loanDuration),
      loanOwnerAddressHash: fromText(offerLoanConfig.walletAddressHash),
    };

    tx.payToContract(
      tempscriptAddress,
      { inline: Data.to(offerLoanDatum, OfferLoanDatum) },
      {
        [offerLoanConfig.loanAsset]: BigInt(loanAmountInEachUTXO),
      }
    );
  }

  return tx;
}
