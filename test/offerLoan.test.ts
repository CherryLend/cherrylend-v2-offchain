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
      tokenName: "",
    },
    interestAmount: 100,
    interestAsset: {
      policyId: "",
      tokenName: "",
    },
    loanAsset: {
      policyId: "",
      tokenName: "",
    },
    loanDuration: 100,
    lenderPubKeyHash: lenderPubKeyHash as string,
    totalLoanAmount: 300,
    amountInEachUTxO: 100,
    liquidationPolicy: "",
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
  });

  expect(tx.type).toBe("success");
});
