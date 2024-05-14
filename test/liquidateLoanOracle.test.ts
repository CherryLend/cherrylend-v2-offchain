import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  liquidateLoanOracleTx,
  getValidators,
  generateAccountSeedPhrase,
  CollateralDatum,
  AssetClassD,
  buildMultisigScript,
  LiquidateLoanOracleConfig,
  bytesToScript,
} from "../src/index.ts";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
  oracles: any[];
  oracleScript: string;
};

beforeEach<LucidContext>(async (context) => {
  context.users = await generateAccountSeedPhrase({
    lovelace: BigInt(100_000_000),
  });

  context.emulator = new Emulator([context.users]);
  context.lucid = await Lucid.new(context.emulator);

  context.oracles = [
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
  ];

  const oraclesPubKeyHashes = context.oracles.flatMap((account) => {
    const hash = context.lucid.utils.getAddressDetails(account.address)
      .paymentCredential?.hash;
    if (!hash) return [];
    return [hash];
  });

  const { script: oracle } = buildMultisigScript(oraclesPubKeyHashes, 3);

  context.oracleScript = oracle;
});

test<LucidContext>("Can liquidate loan transaction if undercollateraized", async ({
  lucid,
  users,
  emulator,
  oracles,
  oracleScript,
}) => {
  lucid.selectWalletFromSeed(users.seedPhrase);

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
    loanDuration: BigInt(1000000000000),
    lendTime: BigInt(emulator.now() - 100_000),
    lenderPubKeyHash: lenderPubKeyHash as string,
    totalInterestAmount: BigInt(100),
    totalLoanAmount: BigInt(100),
    borrowerPubKeyHash: lenderPubKeyHash as string,
    liquidationPolicy: lucid.utils.mintingPolicyToId(
      bytesToScript(oracleScript, "Native")
    ),
  };

  const datum = Data.to(collateralDatum, CollateralDatum);

  const collateralUTxO: UTxO = {
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

  const liquidateCollateralConfig: LiquidateLoanOracleConfig = {
    collateralUTxOs: [collateralUTxO],
    lenderPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
    oracleScript: oracleScript,
    stakeHash: "93c550e1b3946e398c74806b5c133ff52ab021183e2a8be2a80caa06",
  };

  const tx = await liquidateLoanOracleTx(lucid, liquidateCollateralConfig);

  expect(tx.type).toBe("success");

  const liquidationCBORHex = tx.data?.toString();

  const userSign = await lucid
    .fromTx(liquidationCBORHex as string)
    .partialSign();

  lucid.selectWalletFromSeed(oracles[0].seedPhrase);
  const partialSignOracle0 = await lucid
    .fromTx(liquidationCBORHex as string)
    .partialSign();

  lucid.selectWalletFromSeed(oracles[1].seedPhrase);
  const partialSignOracle1 = await lucid
    .fromTx(liquidationCBORHex as string)
    .partialSign();

  lucid.selectWalletFromSeed(oracles[2].seedPhrase);
  const partialSignOracle2 = await lucid
    .fromTx(liquidationCBORHex as string)
    .partialSign();

  await lucid
    .fromTx(liquidationCBORHex as string)
    .assemble([
      userSign,
      partialSignOracle0,
      partialSignOracle1,
      partialSignOracle2,
    ])
    .complete();
});
