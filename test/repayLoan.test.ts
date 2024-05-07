import { expect, test, beforeEach, describe } from "vitest";
import { Data, Emulator, Lucid, UTxO } from "lucid-cardano";
import {
  generateAccountSeedPhrase,
  AssetClassD,
  getValidators,
  CollateralDatum,
  RepayLoanConfig,
  getInterestInfoFromCollateral,
  repayLoanTx,
} from "../src/index.ts";

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

describe("Repay Loan", () => {
  test<LucidContext>("Can repay loan", async ({ lucid, users, emulator }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { collateralScriptAddress } = await getValidators();

    const asset = {
      policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
      tokenName: "4d657368546f6b656e",
    };

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const collateralAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const interestAsset: AssetClassD = {
      policyId: "",
      tokenName: "",
    };

    const loanAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const collateralDatum: CollateralDatum = {
      loanAmount: BigInt(5),
      loanAsset: loanAsset,
      collateralAsset: collateralAsset,
      interestAmount: BigInt(5000000),
      interestAsset: interestAsset,
      loanDuration: BigInt(10000000000),
      lendTime: BigInt(emulator.now() - 100_000),
      totalInterestAmount: BigInt(5000000),
      totalLoanAmount: BigInt(5),
      lenderPubKeyHash: lenderPubKeyHash as string,
      borrowerPubKeyHash: lenderPubKeyHash as string,
    };

    const datum = Data.to(collateralDatum, CollateralDatum);

    const collateralUTxO: UTxO = {
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: collateralScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const interestUTxOsInfo = getInterestInfoFromCollateral([collateralDatum]);

    const loanConfig: RepayLoanConfig = {
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: asset.policyId,
        tokenName: asset.tokenName,
      },
      collateralUTxOs: [collateralUTxO],
      interestUTxOsInfo: interestUTxOsInfo,
      now: emulator.now(),
      borrowerPubKeyHash: lenderPubKeyHash as string,
    };

    const tx = await repayLoanTx(lucid, loanConfig);

    expect(tx.type).toBe("success");
  });

  test<LucidContext>("Can not repay loan if expired", async ({
    lucid,
    users,
    emulator,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { collateralScriptAddress } = await getValidators();

    const asset = {
      policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
      tokenName: "4d657368546f6b656e",
    };

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const collateralAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const interestAsset: AssetClassD = {
      policyId: "",
      tokenName: "",
    };

    const loanAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const collateralDatum: CollateralDatum = {
      loanAmount: BigInt(5),
      loanAsset: loanAsset,
      collateralAsset: collateralAsset,
      interestAmount: BigInt(5000000),
      interestAsset: interestAsset,
      loanDuration: BigInt(1),
      lendTime: BigInt(emulator.now() - 100_000),
      totalInterestAmount: BigInt(5000000),
      totalLoanAmount: BigInt(5),
      lenderPubKeyHash: lenderPubKeyHash as string,
      borrowerPubKeyHash: lenderPubKeyHash as string,
    };

    const datum = Data.to(collateralDatum, CollateralDatum);

    const collateralUTxO: UTxO = {
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: collateralScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const interestUTxOsInfo = getInterestInfoFromCollateral([collateralDatum]);

    const loanConfig: RepayLoanConfig = {
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: asset.policyId,
        tokenName: asset.tokenName,
      },
      collateralUTxOs: [collateralUTxO],
      interestUTxOsInfo: interestUTxOsInfo,
      now: emulator.now(),
      borrowerPubKeyHash: lenderPubKeyHash as string,
    };

    const tx = await repayLoanTx(lucid, loanConfig);

    expect(tx.type).toBe("error");
  });

  test<LucidContext>("Can not repay loan if output interest info doesnt match", async ({
    lucid,
    users,
    emulator,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { collateralScriptAddress } = await getValidators();

    const asset = {
      policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
      tokenName: "4d657368546f6b656e",
    };

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const collateralAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const interestAsset: AssetClassD = {
      policyId: "",
      tokenName: "",
    };

    const loanAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const collateralDatum: CollateralDatum = {
      loanAmount: BigInt(5),
      loanAsset: loanAsset,
      collateralAsset: collateralAsset,
      interestAmount: BigInt(5000000),
      interestAsset: interestAsset,
      loanDuration: BigInt(10000000000),
      lendTime: BigInt(emulator.now() - 100_000),
      totalInterestAmount: BigInt(5000000),
      totalLoanAmount: BigInt(5),
      lenderPubKeyHash: lenderPubKeyHash as string,
      borrowerPubKeyHash: lenderPubKeyHash as string,
    };

    const datum = Data.to(collateralDatum, CollateralDatum);

    const collateralUTxO: UTxO = {
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: collateralScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const interestUTxOsInfo = getInterestInfoFromCollateral([collateralDatum]);

    const loanConfig: RepayLoanConfig = {
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: asset.policyId,
        tokenName: asset.tokenName,
      },
      collateralUTxOs: [collateralUTxO],
      interestUTxOsInfo: [
        {
          repayInterestAmount: 5000000,
          repayLoanAmount: 4,
          lenderPubKeyHash: lenderPubKeyHash as string,
        },
      ],
      now: emulator.now(),
      borrowerPubKeyHash: lenderPubKeyHash as string,
    };

    const tx = await repayLoanTx(lucid, loanConfig);

    expect(tx.type).toBe("error");
  });

  test<LucidContext>("Can not repay loan if not original borrower", async ({
    lucid,
    users,
    emulator,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { collateralScriptAddress } = await getValidators();

    const asset = {
      policyId: "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab5",
      tokenName: "4d657368546f6b656e",
    };

    const account1PubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const account2PubKeyHash = lucid.utils.getAddressDetails(
      await users.account2.address
    ).paymentCredential?.hash;

    const collateralAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const interestAsset: AssetClassD = {
      policyId: "",
      tokenName: "",
    };

    const loanAsset: AssetClassD = {
      policyId: asset.policyId,
      tokenName: asset.tokenName,
    };

    const collateralDatum: CollateralDatum = {
      loanAmount: BigInt(5),
      loanAsset: loanAsset,
      collateralAsset: collateralAsset,
      interestAmount: BigInt(5000000),
      interestAsset: interestAsset,
      loanDuration: BigInt(10000000000),
      lendTime: BigInt(emulator.now() - 100_000),
      totalInterestAmount: BigInt(5000000),
      totalLoanAmount: BigInt(5),
      lenderPubKeyHash: account1PubKeyHash as string,
      borrowerPubKeyHash: account2PubKeyHash as string,
    };

    const datum = Data.to(collateralDatum, CollateralDatum);

    const collateralUTxO: UTxO = {
      txHash:
        "009e369a09d92ef324b361668978055d1d707941db2db670d79ea0f6f93a7f67",
      outputIndex: 1,
      assets: {
        lovelace: 1861920n,
        a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e:
          100n,
      },
      address: collateralScriptAddress,
      datumHash: undefined,
      datum: datum,
      scriptRef: undefined,
    };

    const interestUTxOsInfo = getInterestInfoFromCollateral([collateralDatum]);

    const loanConfig: RepayLoanConfig = {
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: asset.policyId,
        tokenName: asset.tokenName,
      },
      collateralUTxOs: [collateralUTxO],
      interestUTxOsInfo: interestUTxOsInfo,
      now: emulator.now(),
      borrowerPubKeyHash: account1PubKeyHash as string,
    };

    const tx = await repayLoanTx(lucid, loanConfig);

    expect(tx.type).toBe("error");
  });
});
