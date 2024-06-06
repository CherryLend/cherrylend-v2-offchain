import { Emulator, Lucid, UTxO } from "lucid-cardano";
import { beforeEach, describe, expect, test } from "vitest";
import {
  CancelLoanConfig,
  InterestConfig,
  LiquidateLoanConfig,
  LiquidateLoanOracleConfig,
  LoanConfig,
  RepayLoanConfig,
  SelectLoanConfig,
  buildMultisigScript,
  bytesToScript,
  cancelLoanTx,
  generateAccountSeedPhrase,
  getBorrowersCollateral,
  getCollateralInfoFromLoan,
  getInterestInfoFromCollateral,
  getLendersCollateral,
  getLendersInterestPayment,
  getLendersLiquidateLoan,
  getLendersLoanOffers,
  getValidators,
  interestTx,
  liquidateLoanOracleTx,
  liquidateLoanTx,
  loanTx,
  offerLoanTx,
  repayLoanTx,
  selectLoanOffers,
  registerRewardAddress,
} from "../src";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
  oracles: any[];
  oracleScript: string;
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

  context.oracles = [
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
  ];

  const oraclesPubKeyHashes = context.oracles.flatMap((account) => {
    const hash = context.lucid.utils.getAddressDetails(account.address)
      .paymentCredential?.hash;
    if (!hash) return [];
    return [hash];
  });

  const { script: oracle } = buildMultisigScript(oraclesPubKeyHashes, 3);

  context.oracleScript = oracle;
});

describe("All Flows Work", () => {
  test<LucidContext>("Can create loan, cancel loan", async ({
    lucid,
    users,
    emulator,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

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
        policyId: "",
        name: "",
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
      collateralFactor: 10,
    });

    expect(tx.type).toBe("success");

    const cborHex = tx.tx?.toString();
    const userSign = await lucid
      .fromTx(cborHex as string)
      .sign()
      .complete();

    await userSign.submit();

    emulator.awaitBlock(10);

    const utxos = await getLendersLoanOffers(lenderPubKeyHash as string, lucid);

    const cancelLoanConfig: CancelLoanConfig = {
      requestOutRefs: [
        {
          txHash: utxos[0].loanOfferUTxO.txHash,
          outputIndex: utxos[0].loanOfferUTxO.outputIndex,
        },
      ],
      lenderPubKeyHash: lenderPubKeyHash as string,
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
    };

    const cancelLoanConstructedTx = await cancelLoanTx(lucid, cancelLoanConfig);

    expect(cancelLoanConstructedTx.type).toBe("success");

    const cancelLoanCBORHex = cancelLoanConstructedTx.tx?.toString();

    const cancelLoanUserSign = await lucid
      .fromTx(cancelLoanCBORHex as string)
      .sign()
      .complete();

    await cancelLoanUserSign.submit();
  });

  test<LucidContext>("Can create loan, get loan, liquidate loan", async ({
    lucid,
    users,
    emulator,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { loanRewardAddress } = await getValidators(lucid);

    await registerRewardAddress(lucid, loanRewardAddress);

    emulator.awaitBlock(100);

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const tx = await offerLoanTx(lucid, {
      collateralAmount: 10000000,
      collateralAsset: {
        policyId: "",
        name: "",
      },
      interestAmount: 10000000,
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      loanDuration: 100,
      lenderPubKeyHash: lenderPubKeyHash as string,
      totalLoanAmount: 30000000,
      amountInEachUTxO: 10000000,
      liquidationPolicy: "",
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
      collateralFactor: 10,
    });

    expect(tx.type).toBe("success");

    const cborHex = tx.tx?.toString();
    const userSign = await lucid
      .fromTx(cborHex as string)
      .sign()
      .complete();

    await userSign.submit();

    emulator.awaitBlock(100);

    const selectLoanConfig: SelectLoanConfig = {
      loanAmount: 10000000,
      loanAsset: {
        policyId: "",
        name: "",
      },
      collateralAsset: {
        policyId: "",
        name: "",
      },
      apr: 100,
    };

    const utxos = await selectLoanOffers(selectLoanConfig, lucid);

    // @ts-ignore: Unreachable code error
    const allDatums = utxos.map((utxo) => utxo.datum);
    // @ts-ignore: Unreachable code error
    const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

    const outputRef = allUTxOs.map((utxo) => {
      return {
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex,
      };
    });

    const collateralUTxOInfo = getCollateralInfoFromLoan(allDatums);

    const loanConfig: LoanConfig = {
      requestOutRefs: outputRef,
      collateralUTxOsInfo: collateralUTxOInfo,
      collateralAsset: {
        policyId: "",
        name: "",
      },
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      totalInterestAmount: 10000000,
      totalLoanAmount: 10000000,
      borrowerPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      liquidationPolicy: "",
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
      collateralFactor: 10,
    };
    const loanConstructedTx = await loanTx(lucid, loanConfig);

    expect(loanConstructedTx.type).toBe("success");

    const loanCBORHex = loanConstructedTx.tx?.toString();

    const loanUserSign = await lucid
      .fromTx(loanCBORHex as string)
      .sign()
      .complete();

    await loanUserSign.submit();

    emulator.awaitBlock(10000);

    const liquidateLoan = await getLendersLiquidateLoan(
      lenderPubKeyHash as string,
      lucid,
      emulator.now()
    );

    const liquidateLoanUTxOs = liquidateLoan.map((loan) => loan.collateralUTxO);

    const liquidateOutputRef = liquidateLoanUTxOs.map((utxo) => {
      return {
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex,
      };
    });
    const liquidateLoanConfig: LiquidateLoanConfig = {
      requestOutRefs: liquidateOutputRef,
      lenderPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
    };

    const liquidateLoanConstructedTx = await liquidateLoanTx(
      lucid,
      liquidateLoanConfig
    );

    expect(liquidateLoanConstructedTx.type).toBe("success");

    const liquidateLoanCBORHex = liquidateLoanConstructedTx.tx?.toString();
    const liquidateLoanUserSign = await lucid
      .fromTx(liquidateLoanCBORHex as string)
      .sign()
      .complete();

    await liquidateLoanUserSign.submit();
  });

  test<LucidContext>("Can create loan, get loan, liquidate oracle loan", async ({
    users,
    lucid,
    emulator,
    oracles,
    oracleScript,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { loanRewardAddress } = await getValidators(lucid);

    await registerRewardAddress(lucid, loanRewardAddress);

    emulator.awaitBlock(100);

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const liquidationPolicy = lucid.utils.mintingPolicyToId(
      bytesToScript(oracleScript, "Native")
    );

    const offerLoan = await offerLoanTx(lucid, {
      collateralAmount: 10000000,
      collateralAsset: {
        policyId: "",
        name: "",
      },
      interestAmount: 10000000,
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      loanDuration: 100000000000,
      lenderPubKeyHash: lenderPubKeyHash as string,
      totalLoanAmount: 30000000,
      amountInEachUTxO: 10000000,
      liquidationPolicy: liquidationPolicy,
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
      collateralFactor: 10,
    });

    expect(offerLoan.type).toBe("success");

    const cborHex = offerLoan.tx?.toString();
    const offerLoanSigned = await lucid
      .fromTx(cborHex as string)
      .sign()
      .complete();

    await offerLoanSigned.submit();

    emulator.awaitBlock(100);

    const selectLoanConfig: SelectLoanConfig = {
      loanAmount: 10000000,
      loanAsset: {
        policyId: "",
        name: "",
      },
      collateralAsset: {
        policyId: "",
        name: "",
      },
      apr: 100,
    };

    const utxos = await selectLoanOffers(selectLoanConfig, lucid);

    // @ts-ignore: Unreachable code error
    const allDatums = utxos.map((utxo) => utxo.datum);
    // @ts-ignore: Unreachable code error
    const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

    const collateralUTxOInfo = getCollateralInfoFromLoan(allDatums);

    const outputRef = allUTxOs.map((utxo) => {
      return {
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex,
      };
    });

    const loanConfig: LoanConfig = {
      requestOutRefs: outputRef,
      collateralUTxOsInfo: collateralUTxOInfo,
      collateralAsset: {
        policyId: "",
        name: "",
      },
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      totalInterestAmount: 10000000,
      totalLoanAmount: 10000000,
      borrowerPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      liquidationPolicy: liquidationPolicy,
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
      collateralFactor: 10,
    };
    const loan = await loanTx(lucid, loanConfig);

    expect(loan.type).toBe("success");

    const loanCBORHex = loan.tx?.toString();

    const loanSigned = await lucid
      .fromTx(loanCBORHex as string)
      .sign()
      .complete();

    await loanSigned.submit();

    emulator.awaitBlock(10000);

    const collateral = await getLendersCollateral(
      lenderPubKeyHash as string,
      lucid
    );

    const collateralUTxOs = collateral.map((loan) => loan.collateralUTxO);

    const liquidateLoanConfig: LiquidateLoanOracleConfig = {
      requestOutRefs: [
        {
          txHash: collateralUTxOs[0].txHash,
          outputIndex: collateralUTxOs[0].outputIndex,
        },
      ],
      lenderPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      oracleScript: oracleScript,
      stakeHash: "93c550e1b3946e398c74806b5c133ff52ab021183e2a8be2a80caa06",
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
    };

    const tx = await liquidateLoanOracleTx(lucid, liquidateLoanConfig);

    expect(tx.type).toBe("success");

    const liquidationCBORHex = tx.data?.toString();

    const userSign = await lucid
      .fromTx(liquidationCBORHex as string)
      .partialSign();

    lucid.selectWalletFromSeed(oracles[0].seedPhrase);
    const partialSignOracle0 = await lucid
      .fromTx(liquidationCBORHex as string)
      .partialSign();

    lucid.selectWalletFromSeed(oracles[1].seedPhrase);
    const partialSignOracle1 = await lucid
      .fromTx(liquidationCBORHex as string)
      .partialSign();

    lucid.selectWalletFromSeed(oracles[2].seedPhrase);
    const partialSignOracle2 = await lucid
      .fromTx(liquidationCBORHex as string)
      .partialSign();

    const signedLiquidateOracle = await lucid
      .fromTx(liquidationCBORHex as string)
      .assemble([
        userSign,
        partialSignOracle0,
        partialSignOracle1,
        partialSignOracle2,
      ])
      .complete();

    await signedLiquidateOracle.submit();
  });

  test<LucidContext>("Can create loan, get loan, pay interest, get interest payment", async ({
    lucid,
    users,
    emulator,
  }) => {
    lucid.selectWalletFromSeed(users.account1.seedPhrase);

    const { loanRewardAddress, collateralRewardAddress } = await getValidators(
      lucid
    );

    await registerRewardAddress(lucid, loanRewardAddress);

    emulator.awaitBlock(100);

    await registerRewardAddress(lucid, collateralRewardAddress);

    emulator.awaitBlock(100);

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const offerLoan = await offerLoanTx(lucid, {
      collateralAmount: 10000000,
      collateralAsset: {
        policyId: "",
        name: "",
      },
      interestAmount: 10000000,
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      loanDuration: 1000000000000,
      lenderPubKeyHash: lenderPubKeyHash as string,
      totalLoanAmount: 30000000,
      amountInEachUTxO: 10000000,
      liquidationPolicy: "",
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
      collateralFactor: 10,
    });

    expect(offerLoan.type).toBe("success");

    const cborHex = offerLoan.tx?.toString();
    const offerLoanSigned = await lucid
      .fromTx(cborHex as string)
      .sign()
      .complete();

    await offerLoanSigned.submit();

    emulator.awaitBlock(100);

    const selectLoanConfig: SelectLoanConfig = {
      loanAmount: 10000000,
      loanAsset: {
        policyId: "",
        name: "",
      },
      collateralAsset: {
        policyId: "",
        name: "",
      },
      apr: 100,
    };

    const utxos = await selectLoanOffers(selectLoanConfig, lucid);

    // @ts-ignore: Unreachable code error
    const allDatums = utxos.map((utxo) => utxo.datum);
    // @ts-ignore: Unreachable code error
    const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

    const collateralUTxOInfo = getCollateralInfoFromLoan(allDatums);

    const loanOutputRef = allUTxOs.map((utxo) => {
      return {
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex,
      };
    });

    const loanConfig: LoanConfig = {
      requestOutRefs: loanOutputRef,
      collateralUTxOsInfo: collateralUTxOInfo,
      collateralAsset: {
        policyId: "",
        name: "",
      },
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      totalInterestAmount: 10000000,
      totalLoanAmount: 10000000,
      borrowerPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      liquidationPolicy: "",
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
      collateralFactor: 10,
    };
    const loan = await loanTx(lucid, loanConfig);

    expect(loan.type).toBe("success");

    const loanCBORHex = loan.tx?.toString();

    const loanSigned = await lucid
      .fromTx(loanCBORHex as string)
      .sign()
      .complete();

    await loanSigned.submit();

    emulator.awaitBlock(100);

    const collateral = await getBorrowersCollateral(
      lenderPubKeyHash as string,
      lucid
    );

    const collateralUTxO = collateral.map((loan) => loan.collateralUTxO);

    const collateralUTxORef = collateralUTxO.map((utxo) => {
      return {
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex,
      };
    });

    const interestUTxOsInfo = getInterestInfoFromCollateral(collateral);

    const repayLoanConfig: RepayLoanConfig = {
      interestAsset: {
        policyId: "",
        name: "",
      },
      loanAsset: {
        policyId: "",
        name: "",
      },
      requestOutRefs: collateralUTxORef,
      interestUTxOsInfo: interestUTxOsInfo,
      now: emulator.now(),
      borrowerPubKeyHash: lenderPubKeyHash as string,
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
    };

    const repayLoan = await repayLoanTx(lucid, repayLoanConfig);

    expect(repayLoan.type).toBe("success");

    const repayLoanCBORHex = repayLoan.tx?.toString();

    const repayLoanSigned = await lucid
      .fromTx(repayLoanCBORHex as string)
      .sign()
      .complete();

    await repayLoanSigned.submit();

    emulator.awaitBlock(100);

    const interest = await getLendersInterestPayment(
      lenderPubKeyHash as string,
      lucid
    );

    const interestUTxOs = interest.map((loan) => loan.interestUTxO);

    const interestConfig: InterestConfig = {
      requestOutRefs: [
        {
          txHash: interestUTxOs[0].txHash,
          outputIndex: interestUTxOs[0].outputIndex,
        },
      ],
      lenderPubKeyHash: lenderPubKeyHash as string,
      service: {
        fee: 2000000,
        address: await lucid.wallet.address(),
      },
    };

    const interestContructedTx = await interestTx(lucid, interestConfig);

    expect(interestContructedTx.type).toBe("success");

    const interestCBORHex = interestContructedTx.tx?.toString();
    const interestSigned = await lucid
      .fromTx(interestCBORHex as string)
      .sign()
      .complete();

    await interestSigned.submit();
  });
});
