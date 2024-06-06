import { Data, Lucid, UTxO } from "lucid-cardano";
import {
  CollateralDatum,
  InterestDatum,
  OfferLoanDatum,
} from "../contract.types.js";
import {
  CollateralUTxOsInfo,
  GetInterestInfoParams,
  SelectLoanConfig,
} from "../global.types.js";
import { getValidators } from "./scripts.js";
import { minLovelaceAmount } from "../constants.js";

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

export async function selectLoanOffers(
  selectLoanConfig: SelectLoanConfig,
  lucid: Lucid
) {
  const utxos = await getAllLoanUTxOs(lucid);

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
        datum.loanAsset.policyId === selectLoanConfig.loanAsset.policyId &&
        datum.loanAsset.name === selectLoanConfig.loanAsset.name &&
        datum.collateralAsset.policyId ===
          selectLoanConfig.collateralAsset.policyId &&
        datum.collateralAsset.name === selectLoanConfig.collateralAsset.name &&
        datum.interestAmount === BigInt(interestAmount) &&
        datum.interestAsset.policyId === selectLoanConfig.loanAsset.policyId &&
        datum.interestAsset.name === selectLoanConfig.loanAsset.name
      ) {
        return true;
      }
    } catch (error) {
      return false;
    }
  });

  if (availableOffers.length === 0) {
    throw new Error(
      "No available offers that match the loan amount, loan asset, collateral asset, and APR"
    );
  }

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

    const datum = toOfferLoanDatum(offer.datum as string);

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

export async function getAllLoanOffers(lucid: Lucid) {
  const utxos = await getAllLoanUTxOs(lucid);

  const loanOffers = utxos.map((utxo) => {
    const datum = toOfferLoanDatum(utxo.datum as string);
    return {
      loanOfferUTxO: utxo,
      datum: datum,
    };
  });

  return loanOffers;
}

export async function getBorrowersCollateral(
  borrowerPubKeyHash: string,
  lucid: Lucid
) {
  const utxos = await getAllCollateralUTxOs(lucid);

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

export async function getLendersLoanOffers(
  lenderPubKeyHash: string,
  lucid: Lucid
) {
  const utxos = await getAllLoanUTxOs(lucid);

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

export async function getLendersCollateral(
  lenderPubKeyHash: string,
  lucid: Lucid
) {
  const utxos = await getAllCollateralUTxOs(lucid);

  const lendersCollateral = utxos.filter((utxo) => {
    try {
      const datum = toCollateralDatum(utxo.datum as string);
      return datum.lenderPubKeyHash === lenderPubKeyHash;
    } catch (error) {
      return false;
    }
  });

  const lendersCollateralInfo = lendersCollateral.map((utxo) => {
    const datum = toCollateralDatum(utxo.datum as string);
    return {
      collateralUTxO: utxo,
      datum: datum,
    };
  });

  return lendersCollateralInfo;
}

export async function getLendersInterestPayment(
  lenderPubKeyHash: string,
  lucid: Lucid
) {
  const utxos = await getAllInterestUTxOs(lucid);

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
      interestUTxO: utxo,
      datum: datum,
    };
  });

  return lendersInterestPaymentInfo;
}

export async function getLendersLiquidateLoan(
  lenderPubKeyHash: string,
  lucid: Lucid,
  now: number
) {
  const utxos = await getAllCollateralUTxOs(lucid);

  const lendersUTXoS = utxos.filter((utxo) => {
    try {
      const datum = toCollateralDatum(utxo.datum as string);
      const lendTime = parseInt(datum.lendTime.toString());
      const loanDuration = parseInt(datum.loanDuration.toString());

      // Check if the loan has expired and the lender can liquidate the collateral
      return (
        datum.lenderPubKeyHash === lenderPubKeyHash &&
        now > lendTime + loanDuration
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

// Fold the loans into a UTxOs that contains unique lenders.
export function getCollateralInfoFromLoan(
  loanOfferUTxOsDatum: OfferLoanDatum[]
) {
  return loanOfferUTxOsDatum.reduce(
    (collateralInfo: CollateralUTxOsInfo[], datum) => {
      const loanAmount = parseInt(datum.loanAmount.toString());
      const collateralAmount = parseInt(datum.collateralAmount.toString());
      const interestAmount = parseInt(datum.interestAmount.toString());
      const loanDuration = parseInt(datum.loanDuration.toString());
      const lenderPubKeyHash = datum.lenderPubKeyHash;

      const lenderAlreadyExists = collateralInfo.find(
        (info) => info.lenderPubKeyHash === lenderPubKeyHash
      );

      let lovelaceAmount = 0;

      if (datum.loanAsset.policyId === "" && datum.loanAsset.name === "") {
        lovelaceAmount = loanAmount;
      } else {
        lovelaceAmount = minLovelaceAmount;
      }

      if (lenderAlreadyExists) {
        lenderAlreadyExists.loanAmount += loanAmount;
        lenderAlreadyExists.collateralAmount += collateralAmount;
        lenderAlreadyExists.interestAmount += interestAmount;
        lenderAlreadyExists.lovelaceAmount += lovelaceAmount;
      } else {
        collateralInfo.push({
          loanAmount: loanAmount,
          collateralAmount: collateralAmount,
          interestAmount: interestAmount,
          loanDuration: loanDuration,
          lenderPubKeyHash: lenderPubKeyHash,
          lovelaceAmount: lovelaceAmount,
        });
      }

      return collateralInfo;
    },
    []
  );
}

export function getInterestInfoFromCollateral(
  collateral: GetInterestInfoParams[]
) {
  return collateral.map((collateral) => {
    const repayLoanAmount = parseInt(collateral.datum.loanAmount.toString());
    const repayInterestAmount = parseInt(
      collateral.datum.interestAmount.toString()
    );
    const lenderPubKeyHash = collateral.datum.lenderPubKeyHash;
    const lovelaceAmount = Number(collateral.collateralUTxO.assets["lovelace"]);

    return {
      repayLoanAmount: repayLoanAmount,
      repayInterestAmount: repayInterestAmount,
      lenderPubKeyHash: lenderPubKeyHash,
      lovelaceAmount: lovelaceAmount,
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

export function toCollateralDatum(datum: string) {
  return Data.castFrom(Data.from(datum), CollateralDatum);
}

export function toOfferLoanDatum(datum: string) {
  return Data.castFrom(Data.from(datum), OfferLoanDatum);
}

export function toInterestDatum(datum: string) {
  return Data.castFrom(Data.from(datum), InterestDatum);
}

async function getAllCollateralUTxOs(lucid: Lucid) {
  const { collateralScriptAddress } = await getValidators(lucid);

  const scriptUTxOs = await lucid.utxosAt(collateralScriptAddress);
  return scriptUTxOs;
}

async function getAllLoanUTxOs(lucid: Lucid) {
  const { loanScriptAddress } = await getValidators(lucid);

  const scriptUTxOs = await lucid.utxosAt(loanScriptAddress);
  const availableOffers = scriptUTxOs.filter((utxo) => {
    try {
      const datum = Data.castFrom(
        Data.from(utxo.datum as string),
        OfferLoanDatum
      );
      const lovelaceLoan =
        datum.loanAsset.policyId === "" && datum.loanAsset.name === "";

      // Make sure if the loan is an native asset loan, it contains the minlovelaceAmount
      if (lovelaceLoan) {
        return true;
      } else if (utxo.assets.lovelace === BigInt(minLovelaceAmount)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  });
  return availableOffers;
}

async function getAllInterestUTxOs(lucid: Lucid) {
  const { interestScriptAddress } = await getValidators(lucid);

  const scriptUTxOs = await lucid.utxosAt(interestScriptAddress);
  return scriptUTxOs;
}
