import { Data, UTxO } from "lucid-cardano";
import {
  CollateralDatum,
  InterestDatum,
  OfferLoanDatum,
} from "../contract.types.js";
import { SelectLoanConfig } from "../global.types.js";
import { getValidators } from "./scripts.js";
import { getLucid } from "./utils.js";

function weightedShuffle(items: UTxO[], weights: number[]) {
  if (items.length !== weights.length) {
    throw new Error("Items and weights must be of the same size");
  }

  if (!items.length) {
    throw new Error("Items must not be empty");
  }

  let shuffledItems: UTxO[] = [];
  let remainingItems = [...items];
  let remainingWeights = [...weights];

  while (remainingItems.length) {
    // Preparing the cumulative weights array.
    const cumulativeWeights: number[] = [];
    for (let i = 0; i < remainingWeights.length; i += 1) {
      cumulativeWeights[i] =
        remainingWeights[i] + (cumulativeWeights[i - 1] || 0);
    }

    // Getting the random number in a range of [0...sum(weights)]
    const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
    const randomNumber = maxCumulativeWeight * Math.random();

    // Picking the random item based on its weight.
    for (let itemIndex = 0; itemIndex < remainingItems.length; itemIndex += 1) {
      if (cumulativeWeights[itemIndex] >= randomNumber) {
        shuffledItems.push(remainingItems[itemIndex]);
        remainingItems.splice(itemIndex, 1);
        remainingWeights.splice(itemIndex, 1);
        break;
      }
    }
  }

  return shuffledItems;
}

export async function selectLoanOffers(selectLoanConfig: SelectLoanConfig) {
  const utxos = await getAllLoanUTxOs();

  // Get all offers that match the loan amount, loan asset, collateral asset, and APR
  const availableOffers = utxos.filter((utxo) => {
    try {
      const datum = Data.castFrom(
        Data.from(utxo.datum as string),
        OfferLoanDatum
      );
      const interestAmount =
        (parseInt(datum.loanAmount.toString()) * selectLoanConfig.apr) / 100;
      if (
        datum.loanAsset === selectLoanConfig.loanAsset &&
        datum.collateralAsset === selectLoanConfig.collateralAsset &&
        datum.interestAmount === BigInt(interestAmount) &&
        datum.interestAsset === selectLoanConfig.loanAsset
      ) {
        return true;
      }
    } catch (error) {
      return false;
    }
  });

  // Using a decay factor so as the index increases, the weight of the UTxO decreases exponentially.
  // But the weight won't have as much of a spread as we go towards the end of the array
  const decayFactor = 0.5;
  const weights = availableOffers.map((element, index) =>
    Math.exp(-index / decayFactor)
  );
  const orderedShuffle = weightedShuffle(availableOffers, weights);

  const loanOffersWithDatum = [];

  let totalLoanAmount = selectLoanConfig.loanAmount;

  // Fill the loan
  for (let i = 0; i < orderedShuffle.length; i++) {
    const offer = orderedShuffle[i];

    const datum = Data.castFrom(offer.datum as string, OfferLoanDatum);

    const loanAmount = parseInt(datum.loanAmount.toString());
    if (totalLoanAmount - loanAmount >= 0) {
      loanOffersWithDatum.push({
        loanOfferUTxO: offer,
        datum: datum,
      });
      totalLoanAmount -= loanAmount;
    }
  }

  return loanOffersWithDatum;
}

export async function getBorrowersCollateral(borrowerPubKeyHash: string) {
  const utxos = await getAllCollateralUTxOs();

  const collateralUTxOs = utxos.filter((utxo) => {
    try {
      const datum = toCollateralDatum(utxo.datum as string);
      return datum.borrowerPubKeyHash === borrowerPubKeyHash;
    } catch (error) {
      return false;
    }
  });

  const collateralUTxOsInfo = collateralUTxOs.map((utxo) => {
    const datum = toCollateralDatum(utxo.datum as string);
    return {
      collateralUTxO: utxo,
      datum: datum,
    };
  });

  return collateralUTxOsInfo;
}

export async function getLendersLoanOffers(lenderPubKeyHash: string) {
  const utxos = await getAllLoanUTxOs();

  const lendersLoanOffers = utxos.filter((utxo) => {
    try {
      const datum = toOfferLoanDatum(utxo.datum as string);
      return datum.lenderPubKeyHash === lenderPubKeyHash;
    } catch (error) {
      return false;
    }
  });

  const lendersLoanOffersInfo = lendersLoanOffers.map((utxo) => {
    const datum = toOfferLoanDatum(utxo.datum as string);
    return {
      loanOfferUTxO: utxo,
      datum: datum,
    };
  });

  return lendersLoanOffersInfo;
}

export async function getLendersInterestPayment(lenderPubKeyHash: string) {
  const utxos = await getAllInterestUTxOs();

  const lendersInterestPayment = utxos.filter((utxo) => {
    try {
      const datum = toInterestDatum(utxo.datum as string);
      return datum.lenderPubKeyHash === lenderPubKeyHash;
    } catch (error) {
      return false;
    }
  });

  const lendersInterestPaymentInfo = lendersInterestPayment.map((utxo) => {
    const datum = toInterestDatum(utxo.datum as string);
    return {
      interestPaymentUTxO: utxo,
      datum: datum,
    };
  });

  return lendersInterestPaymentInfo;
}

export async function getLendersLiquidateCollateral(lenderPubKeyHash: string) {
  const utxos = await getAllCollateralUTxOs();

  const lendersUTXoS = utxos.filter((utxo) => {
    try {
      const datum = toCollateralDatum(utxo.datum as string);
      const currentPosixTime = Math.floor(Date.now() / 1000);
      const lendTime = parseInt(datum.lendTime.toString());
      const loanDuration = parseInt(datum.loanDuration.toString());

      // Check if the loan has expired and the lender can liquidate the collateral
      return (
        datum.lenderPubKeyHash === lenderPubKeyHash &&
        currentPosixTime > lendTime + loanDuration
      );
    } catch (error) {
      return false;
    }
  });

  const lendersUTXoSInfo = lendersUTXoS.map((utxo) => {
    const datum = toCollateralDatum(utxo.datum as string);
    return {
      collateralUTxO: utxo,
      datum: datum,
    };
  });

  return lendersUTXoSInfo;
}

export function getCollateralInfoFromLoan(
  loanOfferUtxosDatum: OfferLoanDatum[]
) {
  return loanOfferUtxosDatum.map((datum) => {
    const loanAmount = parseInt(datum.loanAmount.toString());
    const collateralAmount = parseInt(datum.collateralAmount.toString());
    const interestAmount = parseInt(datum.interestAmount.toString());
    const loanDuration = parseInt(datum.loanDuration.toString());
    const lenderPubKeyHash = datum.lenderPubKeyHash;
    return {
      loanAmount: loanAmount,
      collateralAmount: collateralAmount,
      interestAmount: interestAmount,
      loanDuration: loanDuration,
      lenderPubKeyHash: lenderPubKeyHash,
    };
  });
}

export function getInterestInfoFromCollateral(
  collateralDatum: CollateralDatum[]
) {
  return collateralDatum.map((datum) => {
    const repayLoanAmount = parseInt(datum.loanAmount.toString());
    const repayInterestAmount = parseInt(datum.interestAmount.toString());
    const lenderPubKeyHash = datum.lenderPubKeyHash;
    return {
      repayLoanAmount: repayLoanAmount,
      repayInterestAmount: repayInterestAmount,
      lenderPubKeyHash: lenderPubKeyHash,
    };
  });
}

export function splitLoanAmount(amountInEachUTx0: number, amount: number) {
  // Check if it is divisible by the minimun amount, or the minAmount is a multiple of the remainder
  const remainder = amount % amountInEachUTx0;
  if (remainder !== 0 && amountInEachUTx0 % remainder !== 0) {
    throw new Error(
      `Please provide a valid loan amount that can be split up into ${amountInEachUTx0}, or ${amountInEachUTx0} is a multiple of the remainder.`
    );
  }

  const splitAmounts = [];
  let remainingAmount = amount;
  while (remainingAmount > 0) {
    const splitAmount = Math.min(amountInEachUTx0, remainingAmount);
    splitAmounts.push(splitAmount);
    remainingAmount -= splitAmount;
  }

  return splitAmounts;
}

function toCollateralDatum(datum: string) {
  return Data.castFrom(Data.from(datum), CollateralDatum);
}

function toOfferLoanDatum(datum: string) {
  return Data.castFrom(Data.from(datum), OfferLoanDatum);
}

function toInterestDatum(datum: string) {
  return Data.castFrom(Data.from(datum), InterestDatum);
}

async function getAllCollateralUTxOs() {
  const lucid = await getLucid();
  const { collateralScriptAddress } = await getValidators();

  const scriptUtxos = await lucid.utxosAt(collateralScriptAddress);
  return scriptUtxos;
}

async function getAllLoanUTxOs() {
  const lucid = await getLucid();
  const { loanScriptAddress } = await getValidators();

  const scriptUtxos = await lucid.utxosAt(loanScriptAddress);
  return scriptUtxos;
}

async function getAllInterestUTxOs() {
  const lucid = await getLucid();
  const { interestScriptAddress } = await getValidators();

  const scriptUtxos = await lucid.utxosAt(interestScriptAddress);
  return scriptUtxos;
}
