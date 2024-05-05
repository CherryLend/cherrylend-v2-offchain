import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  LoanConfig,
  loanTx,
  generateAccountSeedPhrase,
  AssetClassD,
  OfferLoanDatum,
  getValidators,
  getCollateralInfoFromLoan,
  minLovelaceAmount,
} from "../src/index.ts";

type LucidContext = {
  lucid: Lucid;
  lender: any;
  emulator: Emulator;
};

beforeEach<LucidContext>(async (context) => {
  const lender = await generateAccountSeedPhrase({
    lovelace: BigInt(100_000_000),
  });
  context.lender = lender;
  context.emulator = new Emulator([lender]);
  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Can get loan offer", async ({
  lucid,
  lender,
  emulator,
}) => {
  lucid.selectWalletFromSeed(lender.seedPhrase);

  const { loanScriptAddress } = await getValidators();

  const asset = {
    policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
    tokenName: "4d657368546f6b656e",
  };

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const collateralAsset: AssetClassD = {
    policyId: asset.policyId,
    tokenName: asset.tokenName,
  };

  const interestAsset: AssetClassD = {
    policyId: asset.policyId,
    tokenName: asset.tokenName,
  };

  const loanAsset: AssetClassD = {
    policyId: asset.policyId,
    tokenName: asset.tokenName,
  };

  const offerLoanDatum: OfferLoanDatum = {
    loanAmount: BigInt(100),
    loanAsset: loanAsset,
    collateralAmount: BigInt(100),
    collateralAsset: collateralAsset,
    interestAmount: BigInt(100),
    interestAsset: interestAsset,
    loanDuration: BigInt(10000000000),
    lenderPubKeyHash: lenderPubKeyHash as string,
  };

  const datum = Data.to(offerLoanDatum, OfferLoanDatum);

  const loanUTxO: UTxO = {
    txHash: "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
    outputIndex: 1,
    assets: {
      lovelace: BigInt(minLovelaceAmount),
      a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
        100n,
    },
    address: loanScriptAddress,
    datumHash: undefined,
    datum: datum,
    scriptRef: undefined,
  };

  const collateralUTxOInfo = getCollateralInfoFromLoan([offerLoanDatum]);

  const loanConfig: LoanConfig = {
    loanUTxOs: [loanUTxO],
    collateralUTxOsInfo: collateralUTxOInfo,
    collateralAsset: {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    },
    interestAsset: {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    },
    loanAsset: {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    },
    total_interest_amount: 100,
    total_loan_amount: 100,
    borrowerPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
  };

  const tx = await loanTx(lucid, loanConfig);

  expect(tx.type).toBe("success");
});
