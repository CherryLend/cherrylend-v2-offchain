import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;

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
  loanUTXoSAmount: number[];
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
  lendTime: POSIXTime;
  borrowerPubKeyHash: string;
  collateralUTxOsInfo: CollateralUTxOsInfo[];
};

type InterestUTxOsInfo = {
  repayLoanAmount: number;
  repayInterestAmount: number;
  lenderPubKeyHash: string;
};

export type RepayLoanConfig = {
  loanAsset: AssetClass;
  interestAsset: AssetClass;
  borrowerPubKeyAddress: string;
  collateralUTxOs: UTxO[];
  interestUTxOsInfo: InterestUTxOsInfo[];
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
};

export type SelectLoanConfig = {
  utxos: UTxO[];
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  apr: number;
};
