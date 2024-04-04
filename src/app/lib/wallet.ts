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

export async function getUtxos(api: WalletApi) {
  lucid.selectWallet(api);
  const utxos = await lucid.wallet.getUtxos();
  return utxos;
}

export async function getBalance(api: WalletApi) {
  const UTXOs = await getUtxos(api);
  const balance = UTXOs.reduce(
    (acc, utxo) => acc + Number(utxo.assets.lovelace),
    0
  );
  const lovelaceToAda = 1000000;
  const balanceInAda = balance / lovelaceToAda;

  return Math.round(balanceInAda);
}

export async function signTx(api: WalletApi, tx: any) {
  lucid.selectWallet(api);
  const signedTx = await lucid.wallet.signTx(tx);
  return signedTx;
}

export async function submitTx(api: WalletApi, tx: any) {
  lucid.selectWallet(api);
  const txId = await lucid.wallet.submitTx(tx);
  return txId;
}
