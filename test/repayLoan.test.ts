import { expect, test, beforeEach } from "vitest";
import { Emulator, Lucid } from "lucid-cardano";
import {
  generateAccountSeedPhrase,
  getValidators,
  RepayLoanConfig,
  repayLoanTx,
  registerRewardAddress,
  offerLoanTx,
  SelectLoanConfig,
  selectLoanOffers,
  LoanConfig,
  loanTx,
  getBorrowersCollateral,
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

test<LucidContext>("Can repay loan", async ({ lucid, users, emulator }) => {
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
  const allUTxOs = utxos.map((utxo) => utxo.loanOfferUTxO);

  const loanOutputRef = allUTxOs.map((utxo) => {
    return {
      txHash: utxo.txHash,
      outputIndex: utxo.outputIndex,
    };
  });

  const loanConfig: LoanConfig = {
    requestOutRefs: loanOutputRef,
    borrowerPubKeyHash: lenderPubKeyHash as string,
    now: emulator.now(),
    liquidationPolicy: "",
    service: {
      fee: 2000000,
      address: await lucid.wallet.address(),
    },
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

  const repayLoanConfig: RepayLoanConfig = {
    requestOutRefs: collateralUTxORef,
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
});
