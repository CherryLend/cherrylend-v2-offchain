import { UTxO } from "lucid-cardano";
import { CollateralDatum } from "./contract.types.js";

export type POSIXTime = number;
export type CBORHex = string;
export type Address = string;

export type AssetClass = {
  policyId: string;
  name: string;
};

type Service = {
  fee: number;
  address: string;
};

export type RequestOutRef = {
  txHash: string;
  outputIndex: number;
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
  collateralFactor: number;
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
  requestOutRefs: RequestOutRef[];
  borrowerPubKeyHash: string;
  now: POSIXTime;
  liquidationPolicy: string;
  service: Service;
};

export type RepayLoanConfig = {
  loanAsset: AssetClass;
  interestAsset: AssetClass;
  requestOutRefs: RequestOutRef[];
  now: POSIXTime;
  borrowerPubKeyHash: string;
  service: Service;
};

export type CancelLoanConfig = {
  lenderPubKeyHash: string;
  requestOutRefs: RequestOutRef[];
  service: Service;
};

export type InterestConfig = {
  lenderPubKeyHash: string;
  requestOutRefs: RequestOutRef[];
  service: Service;
};

export type LiquidateLoanConfig = {
  lenderPubKeyHash: string;
  requestOutRefs: RequestOutRef[];
  now: POSIXTime;
  service: Service;
};

export type LiquidateLoanOracleConfig = {
  lenderPubKeyHash: string;
  requestOutRefs: RequestOutRef[];
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

export type GetInterestInfoParams = {
  collateralUTxO: UTxO;
  datum: CollateralDatum;
};
