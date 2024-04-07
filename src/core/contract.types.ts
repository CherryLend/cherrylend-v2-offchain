import { Data } from "lucid-cardano";

export const AssetClassSchema = Data.Object({
  policyId: Data.Bytes(),
  tokenName: Data.Bytes(),
});
export type AssetClassD = Data.Static<typeof AssetClassSchema>;
export const AssetClassD = AssetClassSchema as unknown as AssetClassD;

export const OfferLoanDatumSchema = Data.Object({
  collateralAsset: AssetClassSchema,
  collateralAmount: Data.Integer(),
  interestAsset: AssetClassSchema,
  interestAmount: Data.Integer(),
  loanAsset: AssetClassSchema,
  loanAmount: Data.Integer(),
  loanDuration: Data.Integer(),
  loanOwnerPubKeyHash: Data.Bytes(),
});
export type OfferLoanDatum = Data.Static<typeof OfferLoanDatumSchema>;
export const OfferLoanDatum = OfferLoanDatumSchema as unknown as OfferLoanDatum;
