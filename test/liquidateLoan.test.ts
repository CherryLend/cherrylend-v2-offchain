import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  liquidateLoanTx,
  getValidators,
  generateAccountSeedPhrase,
  CollateralDatum,
  AssetClassD,
  LiquidateLoanConfig,
} from "../src/index.ts";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
};

beforeEach<LucidContext>(async (context) => {
  context.users = await generateAccountSeedPhrase({
    lovelace: BigInt(100_000_000),
  });

  context.emulator = new Emulator([context.users]);
  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Can liquidate loan transaction if deadline passed and lender signed transaction", async ({
  lucid,
  users,
  emulator,
}) => {
  lucid.selectWalletFromSeed(users.seedPhrase);

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const liquidateLoanConfig: LiquidateLoanConfig = {
    requestOutRefs: [
      {
        txHash:
          "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
        outputIndex: 1,
      },
    ],
    lenderPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
  };

  const tx = await liquidateLoanTx(lucid, liquidateLoanConfig);

  expect(tx.type).toBe("success");
});
