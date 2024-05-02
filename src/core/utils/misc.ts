import { Data, UTxO } from "lucid-cardano";
import {
  CollateralDatum,
  InterestDatum,
  OfferLoanDatum,
} from "../contract.types.js";
import { SelectLoanConfig } from "../global.types.js";

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

export function getBorrowersCollateral(
  utxos: UTxO[],
  borrowerPubKeyHash: string
) {
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

export function getLendersLoanOffers(utxos: UTxO[], lenderPubKeyHash: string) {
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

export function getLendersInterestPayment(
  utxos: UTxO[],
  lenderPubKeyHash: string
) {
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

export function getLendersLiquidateCollateral(
  utxos: UTxO[],
  lenderPubKeyHash: string
) {
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
  return loanOfferUtxosDatum.map((utxo) => {
    const loanAmount = parseInt(utxo.loanAmount.toString());
    const collateralAmount = parseInt(utxo.collateralAmount.toString());
    const interestAmount = parseInt(utxo.interestAmount.toString());
    const loanDuration = parseInt(utxo.loanDuration.toString());
    const lenderPubKeyHash = utxo.lenderPubKeyHash;
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
  interestUtxosDatum: CollateralDatum[]
) {
  return interestUtxosDatum.map((utxo) => {
    const repayLoanAmount = parseInt(utxo.loanAmount.toString());
    const repayInterestAmount = parseInt(utxo.interestAmount.toString());
    const lenderPubKeyHash = utxo.lenderPubKeyHash;
    return {
      repayLoanAmount: repayLoanAmount,
      repayInterestAmount: repayInterestAmount,
      lenderPubKeyHash: lenderPubKeyHash,
    };
  });
}

const toCollateralDatum = (datum: string) => {
  return Data.castFrom(Data.from(datum), CollateralDatum);
};

const toOfferLoanDatum = (datum: string) => {
  return Data.castFrom(Data.from(datum), OfferLoanDatum);
};

const toInterestDatum = (datum: string) => {
  return Data.castFrom(Data.from(datum), InterestDatum);
};
