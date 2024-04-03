import Image from "next/image";

export default function Home() {
  const submitLoan = async () => {};

  const connectToNamiWallet = async () => {
    const api = await window.cardano.nami.enable();
  };

  return <h1>hi</h1>;
}
