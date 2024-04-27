import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  InterestDatum,
  interestTx,
  getValidators,
  generateAccountSeedPhrase,
  AssetClassD,
} from "../src/index.ts";

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

test<LucidContext>("Can create interest transaction", async ({
  lucid,
  lender,
}) => {
  lucid.selectWalletFromSeed(lender.seedPhrase);

  const { interestValidator, interestValidatorAddress } = await getValidators();

  const lenderPubKeyHash = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential?.hash;

  const loanAsset: AssetClassD = {
    policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
    tokenName: "4d657368546f6b656e",
  };

  const interestAsset: AssetClassD = {
    policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
    tokenName: "4d657368546f6b656e",
  };

  const interestDatum: InterestDatum = {
    repayLoanAmount: BigInt(100),
    repayLoanAsset: loanAsset,
    repayInterestAmount: BigInt(100),
    repayInterestAsset: interestAsset,
    lenderPubKeyHash: lenderPubKeyHash as string,
  };

  const datum = Data.to(interestDatum, InterestDatum);

  const cancelLoanUTxO: UTxO = {
    txHash: "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
    outputIndex: 1,
    assets: {
      lovelace: 1861920n,
      a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
        100n,
    },
    address: interestValidatorAddress,
    datumHash: undefined,
    datum: datum,
    scriptRef: undefined,
  };

  const tx = await interestTx(lucid, {
    interestUTxOs: [cancelLoanUTxO],
    interestValidator: interestValidator,
    lenderPubKeyHash: lenderPubKeyHash as string,
  });

  expect(tx.type).toBe("success");
});
