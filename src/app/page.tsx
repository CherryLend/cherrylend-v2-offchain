"use client";
import { useState } from "react";
import { WalletApi } from "lucid-cardano";
import { getBalance, getWalletAddress } from "./lib/wallet";
import { getOfferAssetLoanTx } from "./lib/submitLoan";
import { getLucid } from "./lib/lucid";

type Tab = "Lender" | "Borrower";
type LenderSubTab =
  | "Create Loan Offer"
  | "Cancel Loan Offer"
  | "Consume collateral"
  | "Interest";
type BorrowerSubTab = "Borrow" | "Repay";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletApi, setWalletApi] = useState<WalletApi>(
    undefined as unknown as WalletApi
  );
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [adaAmount, setAdaAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("Lender");
  const [activeSubTab, setActiveSubTab] = useState("Create Loan Offer");
  const [txId, setTxId] = useState<string>("");

  const submitLoan = async () => {
    const lucid = await getLucid();
    lucid.selectWallet(walletApi);

    const walletAddressHash =
      lucid.utils.getAddressDetails(await lucid.wallet.address())
        .paymentCredential?.hash ?? "";

    // Temp hard coded values
    const apr = 10;
    const daysOfLoan = 10;
    const loanAsset =
      "a1deebd26b685e6799218f60e2cad0a80928c4145d12f1bf49aebab54d657368546f6b656e";
    const collateralAsset = "lovelace";
    const interestAsset = "lovelace";
    const collateralPercentage = 150;
    const loanAmount = 100;

    const submitLoanTx = await getOfferAssetLoanTx(
      walletAddressHash,
      apr,
      daysOfLoan,
      loanAmount,
      loanAsset,
      collateralAsset,
      collateralPercentage,
      interestAsset
    );

    const tx = lucid.newTx();
    const completedTx = await tx.compose(submitLoanTx).complete();
    const signedTx = await completedTx.sign().complete();
    const txId = await signedTx.submit();

    setTxId(txId);
  };

  const LenderTabContent = ({
    activeSubTab,
  }: {
    activeSubTab: LenderSubTab;
  }) => {
    switch (activeSubTab) {
      case "Create Loan Offer":
        return (
          <div className="space-y-4">
            <p>Create Loan Offer</p>
            <div></div>
            <button
              onClick={submitLoan}
              className="px-4 py-2 border-2 rounded-lg"
            >
              Submit Loan
            </button>
          </div>
        );
      case "Cancel Loan Offer":
        return <p>Cancel Loan Offer</p>;
      case "Consume collateral":
        return <p>Consume collateral</p>;
      case "Interest":
        return <p>Interest</p>;
      default:
        return null;
    }
  };

  const BorrowerTabContent = ({
    activeSubTab,
  }: {
    activeSubTab: BorrowerSubTab;
  }) => {
    switch (activeSubTab) {
      case "Borrow":
        return <p>Borrow</p>;
      case "Repay":
        return <p>Repay</p>;
      default:
        return null;
    }
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setTxId("");
    if (tab === "Lender") {
      setActiveSubTab("Create Loan Offer");
    } else {
      setActiveSubTab("Borrow");
    }
  };

  const handleSubTabClick = (subTab: string) => {
    setActiveSubTab(subTab);
    setTxId("");
  };

  const connectToNamiWallet = async () => {
    const api = await window.cardano.nami.enable();
    const network = await api.getNetworkId();
    if (network !== 0) {
      alert("Please connect to the Cardano Preprod Network");
      return;
    }
    const walletAddress = await getWalletAddress(api);
    const walletBalance = await getBalance(api);
    setWalletAddress(walletAddress);
    setAdaAmount(walletBalance);
    setWalletApi(api);
    setWalletConnected(true);
  };

  const disconnectWallet = async () => {
    setWalletApi(undefined as unknown as WalletApi);
    setWalletConnected(false);
    setWalletAddress("");
    setAdaAmount(0);
  };

  return (
    <div className="p-8">
      {walletConnected ? (
        <div className="flex justify-end space-x-4">
          <h1 className="text-2xl">
            Wallet Address : {walletAddress.slice(0, 10)}...
          </h1>
          <h1 className="text-2xl">Balance : {adaAmount} ADA</h1>

          <button
            className="border-2 px-4 py-2 rounded-lg"
            onClick={disconnectWallet}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            className="border-2 px-4 py-2 rounded-lg"
            onClick={connectToNamiWallet}
          >
            Connect Nami Wallet
          </button>
        </div>
      )}
      <div className="flex mt-12 mb-4">
        <button
          className={`mr-4 py-2 px-4 rounded-md ${
            activeTab === "Lender"
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => handleTabClick("Lender")}
        >
          Lender
        </button>
        <button
          className={`py-2 px-4 rounded-md ${
            activeTab === "Borrower"
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => handleTabClick("Borrower")}
        >
          Borrower
        </button>
      </div>
      {activeTab === "Lender" && (
        <div>
          <div className="mb-4">
            <button
              className={`mr-2 py-2 px-4 rounded-md ${
                activeSubTab === "Create Loan Offer"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleSubTabClick("Create Loan Offer")}
            >
              Create Loan Offer
            </button>
            <button
              className={`mr-2 py-2 px-4 rounded-md ${
                activeSubTab === "Cancel Loan Offer"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleSubTabClick("Cancel Loan Offer")}
            >
              Cancel Loan Offer
            </button>
            <button
              className={`mr-2 py-2 px-4 rounded-md ${
                activeSubTab === "Consume collateral"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleSubTabClick("Consume collateral")}
            >
              Consume collateral
            </button>
            <button
              className={`mr-2 py-2 px-4 rounded-md ${
                activeSubTab === "Interest"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleSubTabClick("Interest")}
            >
              Interest
            </button>
          </div>
          <LenderTabContent activeSubTab={activeSubTab as LenderSubTab} />
        </div>
      )}
      {activeTab === "Borrower" && (
        <div>
          <div className="mb-4">
            <button
              className={`mr-2 py-2 px-4 rounded-md ${
                activeSubTab === "Borrow"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleSubTabClick("Borrow")}
            >
              Borrow
            </button>
            <button
              className={`mr-2 py-2 px-4 rounded-md ${
                activeSubTab === "Repay"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleSubTabClick("Repay")}
            >
              Repay
            </button>
          </div>
          <BorrowerTabContent activeSubTab={activeSubTab as BorrowerSubTab} />
        </div>
      )}
      {txId && (
        <div>
          <p>Transaction ID: {txId}</p>
        </div>
      )}
    </div>
  );
}
