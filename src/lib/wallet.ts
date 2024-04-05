import { WalletApi, Lucid } from "lucid-cardano";
import { getLucid } from "./lucid";

let lucid: Lucid;

(async () => {
  lucid = await getLucid();
})();

export async function getWalletAddress(api: WalletApi) {
  lucid.selectWallet(api);
  const walletAddress = await lucid.wallet.address();
  return walletAddress;
}

export async function getBalance(api: WalletApi) {
  lucid.selectWallet(api);
  const UTXOs = await lucid.wallet.getUtxos();
  const balance = UTXOs.reduce(
    (acc, utxo) => acc + Number(utxo.assets.lovelace),
    0
  );
  const lovelaceToAda = 1000000;
  const balanceInAda = balance / lovelaceToAda;

  return Math.round(balanceInAda);
}
