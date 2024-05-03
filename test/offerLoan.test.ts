import { expect, test, beforeEach } from "vitest";
import { Emulator, Lucid } from "lucid-cardano";
import { generateAccountSeedPhrase } from "../src/core/utils/utils.ts";
import { offerLoanTx } from "../src/endpoints/offerLoan.ts";

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

test<LucidContext>("Can submit loan offer", async ({ lucid, lender }) => {
  lucid.selectWalletFromSeed(lender.seedPhrase);

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
  });

  expect(tx.type).toBe("success");
});
