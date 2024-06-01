import { expect, test, beforeEach } from "vitest";
import { Emulator, Lucid } from "lucid-cardano";
import { generateAccountSeedPhrase } from "../src/core/utils/utils.ts";
import { offerLoanTx } from "../src/endpoints/offerLoan.ts";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
};

beforeEach<LucidContext>(async (context) => {
  const users = await generateAccountSeedPhrase({
    lovelace: BigInt(100_000_000),
    ["a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e"]:
      BigInt(10000000),
  });
  context.users = users;
  context.emulator = new Emulator([users]);
  context.lucid = await Lucid.new(context.emulator);
});

test<LucidContext>("Can submit loan offer", async ({ lucid, users }) => {
  lucid.selectWalletFromSeed(users.seedPhrase);

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const tx = await offerLoanTx(lucid, {
    collateralAmount: 100,
    collateralAsset: {
      policyId: "",
      name: "",
    },
    interestAmount: 100,
    interestAsset: {
      policyId: "",
      name: "",
    },
    loanAsset: {
      policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
      name: "4d657368546f6b656e",
    },
    loanDuration: 100,
    lenderPubKeyHash: lenderPubKeyHash as string,
    totalLoanAmount: 10000,
    amountInEachUTxO: 1000,
    liquidationPolicy: "",
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
    collateralFactor: 10,
  });

  expect(tx.type).toBe("success");
});
