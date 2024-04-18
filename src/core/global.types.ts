import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

export type OfferLoanConfig = {
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  collateralAmount: number;
  interestAsset: AssetClass;
  interestAmount: number;
  lenderPubKeyHash: string;
  loanDuration: POSIXTime;
};

export type CollateralInfo = {
  loanAmount: number;
  collateralAmount: number;
  interestAmount: number;
  loanDuration: POSIXTime;
  lenderPubKeyHash: string;
};

export type LoanConfig = {
  borrowerPubKeyAddress: string;
  loanUTxOs: UTxO[];
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  interestAsset: AssetClass;
  total_interest_amount: number;
  total_loan_amount: number;
  lendTime: POSIXTime;
  borrowerPubKeyHash: string;
  collateralInfo: [CollateralInfo];
};

export type InterestInfo = {
  loanAmount: number;
  loanAsset: AssetClass;
  interestAmount: number;
  interestAsset: AssetClass;
  lenderPubKeyHash: string;
};

export type RepayLoanConfig = {
  borrowerPubKeyAddress: string;
  collateralUTxOs: UTxO[];
  interestInfo: [InterestInfo];
};

export type CancelLoanConfig = {
  pubKeyAddress: string;
  UTXOs: UTxO[];
};

export type GetInterestConfig = {
  pubKeyAddress: string;
  UTXOs: UTxO[];
};

export type LiquidateCollateralConfig = {
  pubKeyAddress: string;
  UTXOs: UTxO[];
};
