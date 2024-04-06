import { Data } from "lucid-cardano";

export const OfferLoanDatumSchema = Data.Object({
  collateralAsset: Data.Bytes(),
  collateralAmount: Data.Integer(),
  interestAsset: Data.Bytes(),
  interestAmount: Data.Integer(),
  loanAsset: Data.Bytes(),
  loanAmount: Data.Integer(),
  loanDuration: Data.Integer(),
  loanOwnerAddressHash: Data.Bytes(),
});

export type OfferLoanDatum = Data.Static<typeof OfferLoanDatumSchema>;
export const OfferLoanDatum = OfferLoanDatumSchema as unknown as OfferLoanDatum;
