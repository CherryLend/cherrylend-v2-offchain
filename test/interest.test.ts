import { expect, test, beforeEach } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  InterestDatum,
  interestTx,
  getValidators,
  generateAccountSeedPhrase,
  AssetClassD,
  InterestConfig,
} from "../src/index.ts";
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

describe("Interest", () => {
  test<LucidContext>("Can create interest transaction", async ({
    lucid,
    users,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { interestScriptAddress } = await getValidators();

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
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: interestScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const interestConfig: InterestConfig = {
      interestUTxOs: [cancelLoanUTxO],
      lenderPubKeyHash: lenderPubKeyHash as string,
    };

    const tx = await interestTx(lucid, interestConfig);

    expect(tx.type).toBe("success");
  });

  test<LucidContext>("Can not create interest transaction if not signed by lender", async ({
    lucid,
    users,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { interestScriptAddress } = await getValidators();

    const accoun1PubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const account2PubKeyHash = lucid.utils.getAddressDetails(
      await users.account2.address
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
      lenderPubKeyHash: accoun1PubKeyHash as string,
    };

    const datum = Data.to(interestDatum, InterestDatum);

    const cancelLoanUTxO: UTxO = {
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: interestScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const interestConfig: InterestConfig = {
      interestUTxOs: [cancelLoanUTxO],
      lenderPubKeyHash: account2PubKeyHash as string,
    };

    const tx = await interestTx(lucid, interestConfig);

    expect(tx.type).toBe("error");
  });
});
