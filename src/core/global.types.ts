import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;
export type Address = string;

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

export type OfferLoanConfig = {
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  collateralAmount: number;
  interestAsset: AssetClass;
  interestAmount: number;
  lenderPubKeyHash: string;
  loanDuration: POSIXTime;
  totalLoanAmount: number;
  amountInEachUTxO: number;
};

type CollateralUTxOsInfo = {
  loanAmount: number;
  collateralAmount: number;
  interestAmount: number;
  loanDuration: POSIXTime;
  lenderPubKeyHash: string;
};

export type LoanConfig = {
  loanUTxOs: UTxO[];
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  interestAsset: AssetClass;
  total_interest_amount: number;
  total_loan_amount: number;
  borrowerPubKeyHash: string;
  collateralUTxOsInfo: CollateralUTxOsInfo[];
  now: POSIXTime;
};

type InterestUTxOsInfo = {
  repayLoanAmount: number;
  repayInterestAmount: number;
  lenderPubKeyHash: string;
};

export type RepayLoanConfig = {
  loanAsset: AssetClass;
  interestAsset: AssetClass;
  collateralUTxOs: UTxO[];
  interestUTxOsInfo: InterestUTxOsInfo[];
  now: POSIXTime;
  borrowerPubKeyHash: string;
};

export type CancelLoanConfig = {
  lenderPubKeyHash: string;
  loanUTxOs: UTxO[];
};

export type InterestConfig = {
  lenderPubKeyHash: string;
  interestUTxOs: UTxO[];
};

export type LiquidateCollateralConfig = {
  lenderPubKeyHash: string;
  collateralUTxOs: UTxO[];
  now: POSIXTime;
};

export type SelectLoanConfig = {
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  apr: number;
};
