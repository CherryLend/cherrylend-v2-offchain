import { Data, UTxO } from "lucid-cardano";
import { OfferLoanDatum } from "./contract.types.ts";
import { SelectLoanConfig } from "./global.types.ts";

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

export function selectLoanOffers(selectLoanConfig: SelectLoanConfig) {
  // Get all offers that match the loan amount, loan asset, collateral asset, and APR
  const availableOffers = selectLoanConfig.utxos.filter((utxo) => {
    const datum = Data.castFrom(utxo.datum as string, OfferLoanDatum);
    const interestAmount = (parseInt(datum.loanAmount.toString()) * apr) / 100;
    if (
      datum.loanAsset === selectLoanConfig.loanAsset &&
      datum.collateralAsset === selectLoanConfig.collateralAsset &&
      datum.interestAmount === BigInt(interestAmount) &&
      datum.interestAsset === selectLoanConfig.loanAsset
    ) {
      return true;
    }
  });

  // UTxOs are ordered based on time submitted, eariliest loan offers have the highest
  // changed of being selected
  const decayFactor = 0.5;
  const weights = availableOffers.map((element, index) =>
    Math.exp(-index / decayFactor)
  );
  const orderedShuffle = weightedShuffle(availableOffers, weights);

  let loanUTxOs: UTxO[] = [];
  let totalLoanAmount = selectLoanConfig.loanAmount;

  // Fill the loan
  for (let i = 0; i < orderedShuffle.length; i++) {
    const offer = orderedShuffle[i];
    const datum = Data.castFrom(offer.datum as string, OfferLoanDatum);
    const loanAmount = parseInt(datum.loanAmount.toString());
    if (totalLoanAmount - loanAmount >= 0) {
      loanUTxOs.push(offer);
      totalLoanAmount -= loanAmount;
    }
  }

  return loanUTxOs;
}

export function getBorrowersCollateral(utxos: UTxO[]) {}

export function getLendersLoanOffers(utxos: UTxO[]) {}

export function getLendersInterestPayment(utxos: UTxO[]) {}

export function getLendersLiquidateCollateral(utxos: UTxO[]) {}
