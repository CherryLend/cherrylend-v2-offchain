import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import { generateAccountSeedPhrase } from "../src/core/utils/utils.ts";
import { cancelLoanTx } from "../src/endpoints/cancelLoan.ts";
import { getValidators } from "../src/core/utils/scripts.ts";
import { AssetClassD, OfferLoanDatum } from "../src/core/contract.types.ts";
import { CancelLoanConfig } from "../src/index.ts";

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

test<LucidContext>("Can cancel loan offer if signed by lender", async ({
  lucid,
  users,
}) => {
  lucid.selectWalletFromSeed(users.account1.seedPhrase);

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const cancelLoanConfig: CancelLoanConfig = {
    requestOutRefs: [
      {
        txHash:
          "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
        outputIndex: 1,
      },
    ],
    lenderPubKeyHash: lenderPubKeyHash as string,
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
  };

  const tx = await cancelLoanTx(lucid, cancelLoanConfig);

  expect(tx.type).toBe("success");
});
