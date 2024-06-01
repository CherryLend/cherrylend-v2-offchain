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
} from "../src/index.ts";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
};

beforeEach<LucidContext>(async (context) => {
  const users = await generateAccountSeedPhrase({
    lovelace: BigInt(100_000_000),
  });
  context.users = users;
  context.emulator = new Emulator([users]);
  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Can get loan offer", async ({ lucid, users, emulator }) => {
  lucid.selectWalletFromSeed(users.seedPhrase);

  const { loanScriptAddress } = await getValidators(lucid);

  const asset = {
    policyId: "",
    name: "",
  };

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const collateralAsset: AssetClassD = {
    policyId: asset.policyId,
    name: asset.name,
  };

  const interestAsset: AssetClassD = {
    policyId: asset.policyId,
    name: asset.name,
  };

  const loanAsset: AssetClassD = {
    policyId: asset.policyId,
    name: asset.name,
  };

  const offerLoanDatum: OfferLoanDatum = {
    loanAmount: BigInt(10000000),
    loanAsset: loanAsset,
    collateralAmount: BigInt(10000000),
    collateralAsset: collateralAsset,
    interestAmount: BigInt(100),
    interestAsset: interestAsset,
    loanDuration: BigInt(10000000000),
    lenderPubKeyHash: lenderPubKeyHash as string,
    liquidationPolicy: "",
    collateralFactor: BigInt(10),
  };

  const datum = Data.to(offerLoanDatum, OfferLoanDatum);

  const loanUTxO: UTxO = {
    txHash: "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
    outputIndex: 1,
    assets: {
      lovelace: BigInt(10000000),
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
      name: asset.name,
    },
    interestAsset: {
      policyId: asset.policyId,
      name: asset.name,
    },
    loanAsset: {
      policyId: asset.policyId,
      name: asset.name,
    },
    totalInterestAmount: 100,
    totalLoanAmount: 10000000,
    borrowerPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
    liquidationPolicy: "",
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
    collateralFactor: 10,
  };

  const tx = await loanTx(lucid, loanConfig);

  expect(tx.type).toBe("success");
});
