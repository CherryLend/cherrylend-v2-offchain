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

export async function getLucid() {
  let url = "";
  let network = "";
  if (process.env.NODE_ENV === "prod") {
    url = "https://cardano-mainnet.blockfrost.io/api/v0";
    network = "Mainnet";
  } else {
    url = "https://cardano-preview.blockfrost.io/api/v0";
    network = "Preview";
  }

  const lucid = await Lucid.new(
    new Blockfrost(url, process.env.BLOCKFROST_API_KEY),
    network as "Mainnet" | "Preview"
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

export function quickSubmitBuilder(emulator: Emulator) {
  return async function ({ txBuilder }: { txBuilder: Tx }) {
    const completedTx = await txBuilder.complete();
    const signedTx = await completedTx.sign().complete();
    const txHash = signedTx.submit();
    emulator.awaitBlock(1);

    return txHash;
  };
}
