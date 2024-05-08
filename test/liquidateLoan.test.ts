import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  liquidateLoanTx,
  getValidators,
  generateAccountSeedPhrase,
  CollateralDatum,
  AssetClassD,
  LiquidateCollateralConfig,
} from "../src/index.ts";
import { describe } from "node:test";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
};

beforeEach<LucidContext>(async (context) => {
  context.users = {
    account1: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account2: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
  };

  context.emulator = new Emulator([
    context.users.account1,
    context.users.account2,
  ]);
  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Can liquidate loan transaction if deadline passed and lender signed transaction", async ({
  lucid,
  users,
  emulator,
}) => {
  lucid.selectWalletFromSeed(users.account1.seedPhrase);

  const { collateralScriptAddress } = await getValidators();

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const collateralAsset: AssetClassD = {
    policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
    tokenName: "4d657368546f6b656e",
  };

  const interestAsset: AssetClassD = {
    policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
    tokenName: "4d657368546f6b656e",
  };

  const loanAsset: AssetClassD = {
    policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
    tokenName: "4d657368546f6b656e",
  };

  const collateralDatum: CollateralDatum = {
    loanAmount: BigInt(100),
    loanAsset: loanAsset,
    collateralAsset: collateralAsset,
    interestAmount: BigInt(100),
    interestAsset: interestAsset,
    loanDuration: BigInt(10),
    lendTime: BigInt(emulator.now() - 100_000),
    lenderPubKeyHash: lenderPubKeyHash as string,
    totalInterestAmount: BigInt(100),
    totalLoanAmount: BigInt(100),
    borrowerPubKeyHash: lenderPubKeyHash as string,
    liquidationPolicy: "",
  };

  const datum = Data.to(collateralDatum, CollateralDatum);

  const cancelLoanUTxO: UTxO = {
    txHash: "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
    outputIndex: 1,
    assets: {
      lovelace: 1861920n,
      a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
        100n,
    },
    address: collateralScriptAddress,
    datumHash: undefined,
    datum: datum,
    scriptRef: undefined,
  };

  const liquidateCollateralConfig: LiquidateCollateralConfig = {
    collateralUTxOs: [cancelLoanUTxO],
    lenderPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
  };

  const tx = await liquidateLoanTx(lucid, liquidateCollateralConfig);

  expect(tx.type).toBe("success");
});
