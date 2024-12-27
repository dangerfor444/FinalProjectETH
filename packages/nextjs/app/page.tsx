"use client";

import { useState } from "react";
import { ethers } from "ethers";
import deployedContracts from "~~/contracts/deployedContracts";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const contractAddress = deployedContracts[31337].YourContract.address;
  const contractABI = deployedContracts[31337].YourContract.abi;

  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceId, setInvoiceId] = useState("");

  const [paidInvoices, setPaidInvoices] = useState<
    { id: string; recipient: string; description: string; amount: string }[]
  >([]);
  const [createdInvoices, setCreatedInvoices] = useState<
    { id: string; recipient: string; description: string; amount: string }[]
  >([]);

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask не установлен!");
      return;
    }
    try {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []);
      const signer = newProvider.getSigner();

      const account = await signer.getAddress();

      setProvider(newProvider);
      setSigner(signer);
      setCurrentAccount(account);
    } catch (error) {
      console.error("connectWallet error:", error);
    }
  }

  async function createInvoice() {
    if (!signer) {
      alert("Сначала подключите кошелек!");
      return;
    }
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const amountWei = ethers.utils.parseEther(amount);

      const tx = await contract.createInvoice(recipient, description, amountWei);
      const receipt = await tx.wait(); // Ждём подтверждения

      const invoiceId = receipt.events[0].args.invoiceId.toString();

      alert(`Инвойс создан! ID: ${invoiceId}`);

      setCreatedInvoices(prev => [
        ...prev,
        {
          id: invoiceId,
          recipient,
          description,
          amount,
        },
      ]);

      setRecipient("");
      setDescription("");
      setAmount("");
    } catch (error) {
      console.error("createInvoice error:", error);
      alert("Ошибка создания инвойса. Проверьте логи.");
    }
  }

  async function payInvoice() {
    if (!signer) {
      alert("Сначала подключите кошелек!");
      return;
    }
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const amountWei = ethers.utils.parseEther(amount);

      const invoiceToPay = createdInvoices.find(invoice => invoice.id === invoiceId);

      if (!invoiceToPay) {
        alert("Инвойс не найден. Проверьте ID.");
        return;
      }

      const tx = await contract.payInvoice(invoiceId, {
        value: amountWei,
      });
      await tx.wait();

      setPaidInvoices(prev => [
        ...prev,
        {
          id: invoiceToPay.id,
          recipient: invoiceToPay.recipient,
          description: invoiceToPay.description,
          amount: invoiceToPay.amount,
        },
      ]);
      alert("Инвойс оплачен!");
    } catch (error) {
      console.error("payInvoice error:", error);
      alert("Ошибка оплаты инвойса. Проверьте логи.");
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h1>Система оплаты счетов</h1>

      {currentAccount ? (
        <p className="mb-4">Подключен аккаунт: {currentAccount}</p>
      ) : (
        <button className="btn btn-primary" onClick={connectWallet}>
          Подключить кошелек
        </button>
      )}

      <div className="mt-8 mt">
        <h2>Создание инвойса</h2>
        <input
          type="text"
          placeholder="Адрес получателя"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
        />
        <input type="text" placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="text" placeholder="Сумма в ETH" value={amount} onChange={e => setAmount(e.target.value)} />
        <button className="btn btn-secondary" onClick={createInvoice}>
          Создать инвойс
        </button>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-xl text-gray-800 mb-4">Созданные инвойсы</h2>
        <ul className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {createdInvoices.map((invoice, index) => (
            <li key={index} className="flex justify-between items-center p-4 hover:bg-gray-100 transition duration-200">
              <div className="flex-1">
                <p className="font-medium text-gray-700">
                  ID для оплаты: <span className="font-bold">{invoice.id}</span>
                </p>
                <p className="text-gray-600">
                  Получатель: <span className="font-bold">{invoice.recipient}</span>
                </p>
                <p className="text-gray-600">
                  Описание: <span className="font-bold">{invoice.description}</span>
                </p>
                <p className="text-gray-600">
                  Сумма: <span className="font-bold">{invoice.amount} ETH</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h2>Оплата инвойса</h2>
        <input type="text" placeholder="ID инвойса" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
        <input
          type="text"
          placeholder="Сумма в ETH (должна совпадать с суммой оплаты инвойса)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button className="btn btn-accent" onClick={payInvoice}>
          Оплатить инвойс
        </button>
      </div>

      <div className="mt-8">
        <h2>Оплаченные инвойсы</h2>
        <ul className="invoice-list">
          {paidInvoices.map((invoice, index) => (
            <li key={index} className="invoice-item">
              <span>ID: {invoice.id}</span>
              <span>Описание: {invoice.description}</span>
              <span>Сумма: {invoice.amount} ETH</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
