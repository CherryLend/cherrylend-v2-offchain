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

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const liquidateLoanConfig: LiquidateLoanOracleConfig = {
    requestOutRefs: [
      {
        txHash:
          "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
        outputIndex: 1,
      },
    ],
    lenderPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
    oracleScript: oracleScript,
    stakeHash: "93c550e1b3946e398c74806b5c133ff52ab021183e2a8be2a80caa06",
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
  };

  const tx = await liquidateLoanOracleTx(lucid, liquidateLoanConfig);

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
