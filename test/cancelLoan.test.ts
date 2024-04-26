import { expect, test, beforeEach } from "vitest";
import { Emulator, Lucid, UTxO } from "lucid-cardano";
import { generateAccountSeedPhrase } from "../src/core/utils/utils.ts";
import { cancelLoanTx } from "../src/endpoints/cancelLoan.ts";
import { getValidators } from "../src/core/scripts.ts";

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

  const { loanValidator } = await getValidators();

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const cancelLoanUTxO: UTxO = {
    txHash: "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
    outputIndex: 1,
    assets: {
      lovelace: 1861920n,
      a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
        100n,
    },
    address: "addr_test1wpm4w8zkz0jp6ujg55m06xtw3h3ypnl86wnzuzaggtumpqcdulyqe",
    datumHash: undefined,
    datum:
      "d8799f1864d8799f581ca1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5494d657368546f6b656eff1864d8799f581ca1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5494d657368546f6b656eff1864d8799f581ca1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5494d657368546f6b656eff1b00000002540be400581c20e42d6747604de6ef2680e080699485868271fe94cdac283cdefe67ff",
    scriptRef: undefined,
  };

  const tx = await cancelLoanTx({
    loanUTxOs: [cancelLoanUTxO],
    loanValidator: loanValidator,
    lenderPubKeyHash: lenderPubKeyHash as string,
  });

  expect(tx.type).toBe("success");
});
