import { Data } from "lucid-cardano";

export const AssetClassSchema = Data.Object({
  policyId: Data.Bytes(),
  name: Data.Bytes(),
});
export type AssetClassD = Data.Static<typeof AssetClassSchema>;
export const AssetClassD = AssetClassSchema as unknown as AssetClassD;

export const OfferLoanDatumSchema = Data.Object({
  loanAmount: Data.Integer(),
  loanAsset: AssetClassSchema,
  collateralAmount: Data.Integer(),
  collateralAsset: AssetClassSchema,
  interestAmount: Data.Integer(),
  interestAsset: AssetClassSchema,
  loanDuration: Data.Integer(),
  lenderPubKeyHash: Data.Bytes(),
  liquidationPolicy: Data.Bytes(),
  collateralFactor: Data.Integer(),
});
export type OfferLoanDatum = Data.Static<typeof OfferLoanDatumSchema>;
export const OfferLoanDatum = OfferLoanDatumSchema as unknown as OfferLoanDatum;

export const CollateralDatumSchema = Data.Object({
  loanAmount: Data.Integer(),
  loanAsset: AssetClassSchema,
  collateralAsset: AssetClassSchema,
  interestAmount: Data.Integer(),
  interestAsset: AssetClassSchema,
  loanDuration: Data.Integer(),
  lendTime: Data.Integer(),
  lenderPubKeyHash: Data.Bytes(),
  totalInterestAmount: Data.Integer(),
  totalLoanAmount: Data.Integer(),
  borrowerPubKeyHash: Data.Bytes(),
  liquidationPolicy: Data.Bytes(),
  collateralFactor: Data.Integer(),
});
export type CollateralDatum = Data.Static<typeof CollateralDatumSchema>;
export const CollateralDatum =
  CollateralDatumSchema as unknown as CollateralDatum;

export const InterestDatumSchema = Data.Object({
  repayLoanAmount: Data.Integer(),
  repayLoanAsset: AssetClassSchema,
  repayInterestAmount: Data.Integer(),
  repayInterestAsset: AssetClassSchema,
  lenderPubKeyHash: Data.Bytes(),
});
export type InterestDatum = Data.Static<typeof InterestDatumSchema>;
export const InterestDatum = InterestDatumSchema as unknown as InterestDatum;
