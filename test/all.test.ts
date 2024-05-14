import { Emulator, Lucid } from "lucid-cardano";
import { beforeEach, describe, expect, test } from "vitest";
import {
  CancelLoanConfig,
  InterestConfig,
  LiquidateCollateralConfig,
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
  getLendersLiquidateCollateral,
  getValidators,
  interestTx,
  liquidateLoanOracleTx,
  liquidateLoanTx,
  loanTx,
  offerLoanTx,
  repayLoanTx,
  selectLoanOffers,
} from "../src";

type LucidContext = {
  lucid: Lucid;
  users: any;
  emulator: Emulator;
  oracles: any[];
  oracleScript: string;
};

async function registerRewardAddress(
  lucid: Lucid,
  rewardAddress: string
): Promise<void> {
  const tx = await lucid.newTx().registerStake(rewardAddress).complete();
  const signedTx = await tx.sign().complete();
  await signedTx.submit();
}

beforeEach<LucidContext>(async (context) => {
  context.users = {
    account1: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account2: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account3: await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    account4: await generateAccountSeedPhrase({
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

    const { loanScriptAddress } = await getValidators();

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
    });

    expect(tx.type).toBe("success");

    const cborHex = tx.tx?.toString();
    const userSign = await lucid
      .fromTx(cborHex as string)
      .sign()
      .complete();

    await userSign.submit();

    emulator.awaitBlock(10);

    const utxos = await lucid.utxosAt(loanScriptAddress);

    const cancelLoanConfig: CancelLoanConfig = {
      loanUTxOs: utxos,
      lenderPubKeyHash: lenderPubKeyHash as string,
    };

    const cancelLoanConstructedTx = await cancelLoanTx(lucid, cancelLoanConfig);

    expect(cancelLoanConstructedTx.type).toBe("success");

    const cancelLoanCborHex = cancelLoanConstructedTx.tx?.toString();
    const cancelLoanUserSign = await lucid
      .fromTx(cancelLoanCborHex as string)
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

    const { loanRewardAddress } = await getValidators();

    await registerRewardAddress(lucid, loanRewardAddress);

    emulator.awaitBlock(100);

    const lenderPubKeyHash = lucid.utils.getAddressDetails(
      await lucid.wallet.address()
    ).paymentCredential?.hash;

    const tx = await offerLoanTx(lucid, {
      collateralAmount: 10000000,
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      interestAmount: 10000000,
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
      totalLoanAmount: 30000000,
      amountInEachUTxO: 10000000,
      liquidationPolicy: "",
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
        tokenName: "",
      },
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      apr: 100,
    };

    const utxos = await selectLoanOffers(selectLoanConfig, lucid);

    // @ts-ignore: Unreachable code error
    const allDatums = utxos.map((utxo) => utxo.datum);
    // @ts-ignore: Unreachable code error
    const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

    const collateralUTxOInfo = getCollateralInfoFromLoan(allDatums);

    const loanConfig: LoanConfig = {
      loanUTxOs: allUTxOs,
      collateralUTxOsInfo: collateralUTxOInfo,
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: "",
        tokenName: "",
      },
      total_interest_amount: 10000000,
      total_loan_amount: 10000000,
      borrowerPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      liquidationPolicy: "",
    };
    const loanConstructedTx = await loanTx(lucid, loanConfig);

    expect(loanConstructedTx.type).toBe("success");

    const loanCborHex = loanConstructedTx.tx?.toString();

    const loanUserSign = await lucid
      .fromTx(loanCborHex as string)
      .sign()
      .complete();

    await loanUserSign.submit();

    emulator.awaitBlock(10000);

    const liquidateLoan = await getLendersLiquidateCollateral(
      lenderPubKeyHash as string,
      lucid,
      emulator.now()
    );

    const liquidateLoanUTxOs = liquidateLoan.map((loan) => loan.collateralUTxO);

    const liquidateLoanConfig: LiquidateCollateralConfig = {
      collateralUTxOs: liquidateLoanUTxOs,
      lenderPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
    };

    const liquidateLoanConstructedTx = await liquidateLoanTx(
      lucid,
      liquidateLoanConfig
    );

    expect(liquidateLoanConstructedTx.type).toBe("success");

    const liquidateLoanCborHex = liquidateLoanConstructedTx.tx?.toString();
    const liquidateLoanUserSign = await lucid
      .fromTx(liquidateLoanCborHex as string)
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

    const { loanRewardAddress } = await getValidators();

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
        tokenName: "",
      },
      interestAmount: 10000000,
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: "",
        tokenName: "",
      },
      loanDuration: 100000000000,
      lenderPubKeyHash: lenderPubKeyHash as string,
      totalLoanAmount: 30000000,
      amountInEachUTxO: 10000000,
      liquidationPolicy: liquidationPolicy,
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
        tokenName: "",
      },
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      apr: 100,
    };

    const utxos = await selectLoanOffers(selectLoanConfig, lucid);

    // @ts-ignore: Unreachable code error
    const allDatums = utxos.map((utxo) => utxo.datum);
    // @ts-ignore: Unreachable code error
    const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

    const collateralUTxOInfo = getCollateralInfoFromLoan(allDatums);

    const loanConfig: LoanConfig = {
      loanUTxOs: allUTxOs,
      collateralUTxOsInfo: collateralUTxOInfo,
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: "",
        tokenName: "",
      },
      total_interest_amount: 10000000,
      total_loan_amount: 10000000,
      borrowerPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      liquidationPolicy: liquidationPolicy,
    };
    const loan = await loanTx(lucid, loanConfig);

    expect(loan.type).toBe("success");

    const loanCborHex = loan.tx?.toString();

    const loanSigned = await lucid
      .fromTx(loanCborHex as string)
      .sign()
      .complete();

    await loanSigned.submit();

    emulator.awaitBlock(10000);

    const collateral = await getLendersCollateral(
      lenderPubKeyHash as string,
      lucid
    );

    const collateralUTxOs = collateral.map((loan) => loan.collateralUTxO);

    const liquidateCollateralConfig: LiquidateLoanOracleConfig = {
      collateralUTxOs: collateralUTxOs,
      lenderPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      oracleScript: oracleScript,
    };

    const tx = await liquidateLoanOracleTx(lucid, liquidateCollateralConfig);

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

    const { loanRewardAddress, collateralRewardAddress } =
      await getValidators();

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
        tokenName: "",
      },
      interestAmount: 10000000,
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: "",
        tokenName: "",
      },
      loanDuration: 1000000000000,
      lenderPubKeyHash: lenderPubKeyHash as string,
      totalLoanAmount: 30000000,
      amountInEachUTxO: 10000000,
      liquidationPolicy: "",
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
        tokenName: "",
      },
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      apr: 100,
    };

    const utxos = await selectLoanOffers(selectLoanConfig, lucid);

    // @ts-ignore: Unreachable code error
    const allDatums = utxos.map((utxo) => utxo.datum);
    // @ts-ignore: Unreachable code error
    const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

    const collateralUTxOInfo = getCollateralInfoFromLoan(allDatums);

    const loanConfig: LoanConfig = {
      loanUTxOs: allUTxOs,
      collateralUTxOsInfo: collateralUTxOInfo,
      collateralAsset: {
        policyId: "",
        tokenName: "",
      },
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: "",
        tokenName: "",
      },
      total_interest_amount: 10000000,
      total_loan_amount: 10000000,
      borrowerPubKeyHash: lenderPubKeyHash as string,
      now: emulator.now(),
      liquidationPolicy: "",
    };
    const loan = await loanTx(lucid, loanConfig);

    expect(loan.type).toBe("success");

    const loanCborHex = loan.tx?.toString();

    const loanSigned = await lucid
      .fromTx(loanCborHex as string)
      .sign()
      .complete();

    await loanSigned.submit();

    emulator.awaitBlock(100);

    const collateral = await getBorrowersCollateral(
      lenderPubKeyHash as string,
      lucid
    );

    const collateralDatum = collateral.map((loan) => loan.datum);
    const collateralUTxO = collateral.map((loan) => loan.collateralUTxO);

    const interestUTxOsInfo = getInterestInfoFromCollateral(collateralDatum);

    const repayLoanConfig: RepayLoanConfig = {
      interestAsset: {
        policyId: "",
        tokenName: "",
      },
      loanAsset: {
        policyId: "",
        tokenName: "",
      },
      collateralUTxOs: collateralUTxO,
      interestUTxOsInfo: interestUTxOsInfo,
      now: emulator.now(),
      borrowerPubKeyHash: lenderPubKeyHash as string,
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
      interestUTxOs: interestUTxOs,
      lenderPubKeyHash: lenderPubKeyHash as string,
    };

    const interestContructedTx = await interestTx(lucid, interestConfig);

    expect(interestContructedTx.type).toBe("success");

    const interestCborHex = interestContructedTx.tx?.toString();
    const interestSigned = await lucid
      .fromTx(interestCborHex as string)
      .sign()
      .complete();

    await interestSigned.submit();
  });
});
