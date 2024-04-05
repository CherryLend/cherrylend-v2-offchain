import { Lucid, SpendingValidator, Data } from "lucid-cardano";
import { getLucid } from "./lucid";

let lucid: Lucid;

(async () => {
  lucid = await getLucid();
})();

//Temp Script
const alwaysSucceedScript: SpendingValidator = {
  type: "PlutusV2",
  script: "49480100002221200101",
};

async function formatSubmitLoanDatum(
  apr: number,
  daysOfLoan: number,
  loanAmountInEachUTXO: number,
  loanAsset: string,
  collateralAsset: string,
  collateralPercentage: number,
  interestAsset: string,
  walletAddressHash: string
) {
  const { Data, fromText } = await import("lucid-cardano");

  const interestAmount = (loanAmountInEachUTXO * apr) / 100;
  const collateralAmount = (loanAmountInEachUTXO * collateralPercentage) / 100;

  const DatumSchema = Data.Object({
    collateralAsset: Data.Bytes(),
    collateralAmount: Data.Integer(),
    interestAsset: Data.Bytes(),
    interestAmount: Data.Integer(),
    loan_asset: Data.Bytes(),
    loan_amount: Data.Integer(),
    loan_duration: Data.Integer(),
    loan_owner_address_hash: Data.Bytes(),
  });

  type Datum = Data.Static<typeof DatumSchema>;
  const Datum = DatumSchema as unknown as Datum;

  const datum: Datum = {
    collateralAsset: fromText(collateralAsset),
    collateralAmount: BigInt(collateralAmount),
    interestAsset: fromText(interestAsset),
    interestAmount: BigInt(interestAmount),
    loan_asset: fromText(loanAsset),
    loan_amount: BigInt(loanAmountInEachUTXO),
    loan_duration: BigInt(daysOfLoan),
    loan_owner_address_hash: fromText(walletAddressHash),
  };

  const formattedDatum = Data.to(datum, Datum);

  return formattedDatum;
}

export async function getOfferAssetLoanTx(
  walletAddressHash: string,
  apr: number,
  daysOfLoan: number,
  loanAmount: number,
  loanAsset: string,
  collateralAsset: string,
  collateralPercentage: number,
  interestAsset: string
) {
  const loanAmountInEachUTXO = loanAmount / 10;
  //Min Token Amount needs to be higher than 10 or else it will fail
  //because collateral amount will not be a whole number
  if (loanAmountInEachUTXO < 10) {
    throw new Error("Amount too low");
  }

  const tempscriptAddress = lucid.utils.validatorToAddress(alwaysSucceedScript);

  let tx = lucid.newTx();
  for (let i = 0; i < 10; i++) {
    const datum = await formatSubmitLoanDatum(
      apr,
      daysOfLoan,
      loanAmountInEachUTXO,
      loanAsset,
      collateralAsset,
      collateralPercentage,
      interestAsset,
      walletAddressHash
    );

    tx.payToContract(
      tempscriptAddress,
      { inline: datum },
      {
        [loanAsset]: BigInt(loanAmountInEachUTXO),
      }
    );
  }

  return tx;
}

export async function getOfferADALoanTx(
  walletAddressHash: string,
  apr: number,
  daysOfLoan: number,
  loanAmount: number,
  collateralAsset: string,
  collateralPercentage: number,
  interestAsset: string
) {
  const loanADAAmountInEachUTXO = loanAmount / 10;
  // Min ADA Amount needs to be higher than 1
  if (loanADAAmountInEachUTXO < 1) {
    throw new Error("Amount too low");
  }
  const loanLovelaceAmountInEachUTXO = loanADAAmountInEachUTXO * 1000000;
  const loanAsset = "lovelace";

  const tempscriptAddress = lucid.utils.validatorToAddress(alwaysSucceedScript);

  let tx = lucid.newTx();
  for (let i = 0; i < 10; i++) {
    const datum = await formatSubmitLoanDatum(
      apr,
      daysOfLoan,
      loanLovelaceAmountInEachUTXO,
      loanAsset,
      collateralAsset,
      collateralPercentage,
      interestAsset,
      walletAddressHash
    );

    tx.payToContract(
      tempscriptAddress,
      { inline: datum },
      {
        lovelace: BigInt(loanLovelaceAmountInEachUTXO),
      }
    );
  }

  return tx;
}
