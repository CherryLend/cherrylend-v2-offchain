import { UTxO } from "lucid-cardano";

export type POSIXTime = number;
export type CBORHex = string;
export type Address = string;

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

type Service = {
  fee: number;
  address: string;
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
  liquidationPolicy: string;
  service: Service;
  collateral_factor: number;
};

export type CollateralUTxOsInfo = {
  loanAmount: number;
  collateralAmount: number;
  interestAmount: number;
  loanDuration: POSIXTime;
  lenderPubKeyHash: string;
  lovelaceAmount: number;
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
  liquidationPolicy: string;
  service: Service;
  collateral_factor: number;
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
  service: Service;
};

export type CancelLoanConfig = {
  lenderPubKeyHash: string;
  loanUTxOs: UTxO[];
  service: Service;
};

export type InterestConfig = {
  lenderPubKeyHash: string;
  interestUTxOs: UTxO[];
  service: Service;
};

export type LiquidateCollateralConfig = {
  lenderPubKeyHash: string;
  collateralUTxOs: UTxO[];
  now: POSIXTime;
  service: Service;
};

export type LiquidateLoanOracleConfig = {
  lenderPubKeyHash: string;
  collateralUTxOs: UTxO[];
  now: POSIXTime;
  oracleScript: Address;
  stakeHash: string;
  service: Service;
};

export type SelectLoanConfig = {
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  apr: number;
};
