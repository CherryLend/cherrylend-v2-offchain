import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

export type OfferLoanConfig = {
  pubKeyHash: string;
  apr: number;
  loanDuration: POSIXTime;
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  collateralPercentage: number;
  interestAsset: AssetClass;
  loanScript: CBORHex;
};

export type CancelLoanConfig = {
  pubKeyAddress: string;
  UTXOs: UTxO[];
  loanScript: CBORHex;
};

export type GetInterestConfig = {
  pubKeyAddress: string;
  UTXOs: UTxO[];
  interestScript: CBORHex;
};

export type LiquidateCollateralConfig = {
  pubKeyAddress: string;
  UTXOs: UTxO[];
  collateralScript: CBORHex;
};
