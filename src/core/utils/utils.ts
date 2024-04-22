import { Lucid, Blockfrost, generateSeedPhrase, Assets } from "lucid-cardano";
import { config } from "dotenv";
config();

export async function getLucid() {
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preview.blockfrost.io/api/v0",
      process.env.BLOCKFROST_API_KEY
    ),
    "Preview"
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
