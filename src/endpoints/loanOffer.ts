import { getLucid } from "@/core/utils";
import { loanScript } from "../core/constants";
import { LoanOfferDatum } from "../core/contract.types";
import { Data, fromText } from "lucid-cardano";
import { LoanOfferConfig } from "..";

export async function getOfferLoanTx(loanOfferConfig: LoanOfferConfig) {
  const loanAmountInEachUTXO = loanOfferConfig.loanAmount / 10;
  //Min Token Amount needs to be higher than 10 or else it will fail
  //because collateral amount will not be a whole number
  if (
    loanOfferConfig.loanAsset === "lovelace" &&
    loanAmountInEachUTXO < 1000000
  ) {
    throw new Error("Amount too low");
  } else if (loanAmountInEachUTXO < 10) {
    throw new Error("Amount too low");
  }

  const collateralAmount =
    (loanAmountInEachUTXO * loanOfferConfig.collateralPercentage) / 100;
  const interestAmount = loanAmountInEachUTXO * loanOfferConfig.apr;

  const lucid = await getLucid();

  const tempscriptAddress = lucid.utils.validatorToAddress(loanScript);

  let tx = lucid.newTx();
  for (let i = 0; i < 10; i++) {
    const loanOfferDatum: LoanOfferDatum = {
      collateralAsset: fromText(loanOfferConfig.collateralAsset),
      collateralAmount: BigInt(collateralAmount),
      interestAsset: fromText(loanOfferConfig.interestAsset),
      interestAmount: BigInt(interestAmount),
      loanAsset: fromText(loanOfferConfig.loanAsset),
      loanAmount: BigInt(loanAmountInEachUTXO),
      loanDuration: BigInt(loanOfferConfig.loanDuration),
      loanOwnerAddressHash: fromText(loanOfferConfig.walletAddressHash),
    };

    tx.payToContract(
      tempscriptAddress,
      { inline: Data.to(loanOfferDatum, LoanOfferDatum) },
      {
        [loanOfferConfig.loanAsset]: BigInt(loanAmountInEachUTXO),
      }
    );
  }

  return tx;
}
