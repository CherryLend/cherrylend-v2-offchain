import { Data } from "lucid-cardano";

export const LoanOfferDatumSchema = Data.Object({
  collateralAsset: Data.Bytes(),
  collateralAmount: Data.Integer(),
  interestAsset: Data.Bytes(),
  interestAmount: Data.Integer(),
  loanAsset: Data.Bytes(),
  loanAmount: Data.Integer(),
  loanDuration: Data.Integer(),
  loanOwnerAddressHash: Data.Bytes(),
});

export type LoanOfferDatum = Data.Static<typeof LoanOfferDatumSchema>;
export const LoanOfferDatum = LoanOfferDatumSchema as unknown as LoanOfferDatum;
