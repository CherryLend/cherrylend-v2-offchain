import { Lucid, generateSeedPhrase, Assets } from "lucid-cardano";

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

export async function registerRewardAddress(
  lucid: Lucid,
  rewardAddress: string
): Promise<void> {
  const tx = await lucid.newTx().registerStake(rewardAddress).complete();

  const signedTx = await tx.sign().complete();

  await signedTx.submit();
}
