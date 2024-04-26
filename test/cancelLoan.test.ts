import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import { generateAccountSeedPhrase } from "../src/core/utils/utils.ts";
import { cancelLoanTx } from "../src/endpoints/cancelLoan.ts";
import { getValidators } from "../src/core/scripts.ts";
import { AssetClassD, OfferLoanDatum } from "../src/core/contract.types.ts";

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

test<LucidContext>("Can cancel loan offer", async ({ lucid, lender }) => {
  lucid.selectWalletFromSeed(lender.seedPhrase);

  const { loanValidator } = await getValidators();

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

  const offerLoanDatum: OfferLoanDatum = {
    loanAmount: BigInt(100),
    loanAsset: loanAsset,
    collateralAmount: BigInt(100),
    collateralAsset: collateralAsset,
    interestAmount: BigInt(100),
    interestAsset: interestAsset,
    loanDuration: BigInt(100),
    lenderPubKeyHash: lenderPubKeyHash as string,
  };

  const datum = Data.to(offerLoanDatum, OfferLoanDatum);

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
    datum: datum,
    scriptRef: undefined,
  };

  const tx = await cancelLoanTx(lucid, {
    loanUTxOs: [cancelLoanUTxO],
    loanValidator: loanValidator,
    lenderPubKeyHash: lenderPubKeyHash as string,
  });

  expect(tx.type).toBe("success");
});
