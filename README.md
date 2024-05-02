# cherrylend-v2-offchain

This repo contains the off-chain code for cherrylend-lending-v2

[View technical spec](https://github.com/CherryLend/cherrylend-v2-spec)

[View smart contracts code](https://github.com/CherryLend/cherrylend-v2-smart-contracts)

## Usage Guide 

### Offer Loan
The enpoint `offerLoanTx` takes in lucid and a `offerLoanConfig` as its params.
```
export type OfferLoanConfig = {
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  collateralAmount: number;
  interestAsset: AssetClass;
  interestAmount: number;
  lenderPubKeyHash: string;
  loanDuration: POSIXTime;
  totalLoanAmount: Number;
  amountInEachUTxO: Number;
};
```
All of these will be coming from the front-end. 

### Cancel Loan Offer
The endpoint `cancelLoan` takes in lucid and `CancelLoanConfig` as its params. 
```
export type CancelLoanConfig = {
  lenderPubKeyHash: string;
  loanUTxOs: UTxO[];
};
```

Loans by this lender can be retrieved by using this function which takes in the lenders pubKeyHash
```
function getLendersLoanOffers(lenderPubKeyHash: string){
...
}
```
### Liquidate Collateral 
The endpoint `liquidateCollateralTx` takes in lucid and `LiquidateCollateralConfig` as its params. 
```
export type LiquidateCollateralConfig = {
  lenderPubKeyHash: string;
  collateralUTxOs: UTxO[];
  now: POSIXTime;
};
```

Collateral that can be liquidated by this lender can be retrieved by using this function which takes in the lenders pubKeyHash
```
function getLendersLiquidateCollateral(lenderPubKeyHash: string) {
...
}
```

### Get Interest Payment
The endpoint `interestTx` takes in lucid and `InterestConfig` as its params. 
```
export type InterestConfig = {
  lenderPubKeyHash: string;
  interestUTxOs: UTxO[];
};
```

Interests by this lender can be retrieved by using this function which takes in the lenders pubKeyHash
```
function getLendersInterestPayment(lenderPubKeyHash: string){
...
}
```
### Get Loan
The endpoint `loanTx` takes in lucid and `LoanConfig` as its params. 
```
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
```

The function `selectLoanOffers` takes in `SelectLoanConfig` as a params and returns UTxOs that will fullfill the loan requirement as well as datums formated in a json.
```
export type SelectLoanConfig = {
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  apr: number;
};
```

The field `collateralUTxOsInfo` can be retrieved by using this function `getCollateralInfoFromLoan` which takes in the list of datums returned from `selectLoanOffers`
```
function getCollateralInfoFromLoan(loanOfferUtxosDatum: OfferLoanDatum[]){
...
}
```

### Repay Loan
The endpoint `loanTx` takes in lucid and `LoanConfig` as its params. 
```
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
```

The function `selectLoanOffers` takes in `SelectLoanConfig` as a params and returns UTxOs that will fullfill the loan requirement as well as datums formated in a json.
```
export type SelectLoanConfig = {
  loanAmount: number;
  loanAsset: AssetClass;
  collateralAsset: AssetClass;
  apr: number;
};
```

The field `collateralUTxOsInfo` can be retrieved by using this function `getCollateralInfoFromLoan` which takes in the list of datums returned from `selectLoanOffers`
```
function getCollateralInfoFromLoan(loanOfferUtxosDatum: OfferLoanDatum[]){
...
}

