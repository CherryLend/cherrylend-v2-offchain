import {
  Lucid,
  Blockfrost,
  generateSeedPhrase,
  Assets,
  Emulator,
  Tx,
} from "lucid-cardano";
import { config } from "dotenv";
config();

export const generateAccountSeedPhrase = async (assets: Assets) => {
  const seedPhrase = generateSeedPhrase();
  return {
    seedPhrase,
    address: await (await Lucid.new(undefined, "Custom"))
      .selectWalletFromSeed(seedPhrase)
      .wallet.address(),
    assets,
  };
};

export function quickSubmitBuilder(emulator: Emulator) {
  return async function ({ txBuilder }: { txBuilder: Tx }) {
    const completedTx = await txBuilder.complete();
    const signedTx = await completedTx.sign().complete();
    const txHash = signedTx.submit();
    emulator.awaitBlock(1);

    return txHash;
  };
}

export function getValidityRange(lucid: Lucid, now: number) {
  let validFromInit;
  let validToInit;
  if (process.env.NODE_ENV === "emulator") {
    validFromInit = new Date(now).getTime();
    validToInit = new Date(validFromInit).getTime();
  } else {
    validFromInit = new Date(now).getTime();
    validToInit = new Date(validFromInit).getTime() + 45 * 60 * 1000;
  }

  const validFromSlot = lucid.utils.unixTimeToSlot(validFromInit);
  const validToSlot = lucid.utils.unixTimeToSlot(validToInit);

  const validFrom = lucid.utils.slotToUnixTime(validFromSlot);
  const validTo = lucid.utils.slotToUnixTime(validToSlot);
  return { validFrom, validTo };
}
