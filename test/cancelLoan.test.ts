import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import { generateAccountSeedPhrase } from "../src/core/utils/utils.ts";
import { cancelLoanTx } from "../src/endpoints/cancelLoan.ts";
import { getValidators } from "../src/core/utils/scripts.ts";
import { AssetClassD, OfferLoanDatum } from "../src/core/contract.types.ts";
import { CancelLoanConfig } from "../src/index.ts";
import { describe } from "node:test";

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

describe("Cancel Loan", () => {
  test<LucidContext>("Can cancel loan offer if signed by lender", async ({
    lucid,
    users,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { loanScriptAddress } = await getValidators();

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
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: loanScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const cancelLoanConfig: CancelLoanConfig = {
      loanUTxOs: [cancelLoanUTxO],
      lenderPubKeyHash: lenderPubKeyHash as string,
    };

    const tx = await cancelLoanTx(lucid, cancelLoanConfig);

    expect(tx.type).toBe("success");
  });

  test<LucidContext>("Can not cancel loan offer if not signed by original lender", async ({
    lucid,
    users,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const accoun1PubKeyHash = lucid.utils.getAddressDetails(
      await users.account1.address
    ).paymentCredential?.hash;

    const account2PubKeyHash = lucid.utils.getAddressDetails(
      await users.account2.address
    ).paymentCredential?.hash;

    const { loanScriptAddress } = await getValidators();

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
      lenderPubKeyHash: account2PubKeyHash as string,
    };

    const datum = Data.to(offerLoanDatum, OfferLoanDatum);

    const cancelLoanUTxO: UTxO = {
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: loanScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const cancelLoanConfig: CancelLoanConfig = {
      loanUTxOs: [cancelLoanUTxO],
      lenderPubKeyHash: accoun1PubKeyHash as string,
    };

    const tx = await cancelLoanTx(lucid, cancelLoanConfig);

    expect(tx.type).toBe("error");
  });
});
