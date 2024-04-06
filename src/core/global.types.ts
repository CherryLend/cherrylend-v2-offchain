import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;

export type OfferLoanConfig = {
  walletAddressHash: string;
  apr: number;
  loanDuration: POSIXTime;
  loanAmount: number;
  loanAsset: string;
  collateralAsset: string;
  collateralPercentage: number;
  interestAsset: string;
  loanScript: CBORHex;
};

export type CancelLoanConfig = {
  walletAddressHash: string;
  UTXOs: UTxO[];
  loanScript: CBORHex;
};

export type GetInterestConfig = {
  walletAddressHash: string;
  UTXOs: UTxO[];
  interestScript: CBORHex;
};
