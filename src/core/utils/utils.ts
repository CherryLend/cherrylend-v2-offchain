import { Lucid, Blockfrost, generateSeedPhrase, Assets } from "lucid-cardano";

export async function getLucid() {
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      "preprodMutKHGxUr3JbttdfUaDBlvI9oWGjA75a"
    ),
    "Preprod"
  );
  return lucid;
}

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
