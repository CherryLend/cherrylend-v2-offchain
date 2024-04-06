import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;

export type LoanOfferConfig = {
  walletAddressHash: string;
  apr: number;
  loanDuration: POSIXTime;
  loanAmount: number;
  loanAsset: string;
  collateralAsset: string;
  collateralPercentage: number;
  interestAsset: string;
};

export type CancelLoanConfig = {
  walletAddressHash: string;
  UTXOs: UTxO[];
  loanScript: CBORHex;
};
