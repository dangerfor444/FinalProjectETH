import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  let yourContract: YourContract;
  let owner: any, recipient: any;

  before(async () => {
    [owner, recipient] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = (await yourContractFactory.deploy()) as YourContract;
  });

  describe("Развертывание контракта", function () {
    it("Должен инициализироваться с нулевым количеством инвойсов", async function () {
      expect(await yourContract.invoiceCount()).to.equal(0);
    });
  });

  describe("Создание инвойса", function () {
    it("Должен правильно создать инвойс", async function () {
      const invoiceAmount = "1000000000000000000"; // 1 ETH

      await expect(yourContract.createInvoice(recipient.address, "Payment for services", invoiceAmount))
        .to.emit(yourContract, "InvoiceCreated")
        .withArgs(0, recipient.address, invoiceAmount, "Payment for services");

      expect(await yourContract.invoiceCount()).to.equal(1);
    });

    it("Должен правильно сохранить детали инвойса", async function () {
      const invoice = await yourContract.getInvoice(0);
      expect(invoice.recipient).to.equal(recipient.address);
      expect(invoice.description).to.equal("Payment for services");
      expect(invoice.amount).to.equal("1000000000000000000");
      expect(invoice.paid).to.equal(false);
    });
  });

  describe("Оплата инвойса", function () {
    let invoiceAmount: string;

    beforeEach(async () => {
      [owner, recipient] = await ethers.getSigners();
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      yourContract = (await yourContractFactory.deploy()) as YourContract;
      invoiceAmount = "1000000000000000000";
      await yourContract.createInvoice(owner.address, "Payment for services", invoiceAmount);
    });

    it("Должен разрешать оплату инвойса", async function () {
      await expect(yourContract.payInvoice(0, { value: invoiceAmount }))
        .to.emit(yourContract, "InvoicePaid")
        .withArgs(0, owner.address, invoiceAmount);

      const invoice = await yourContract.getInvoice(0);
      expect(invoice.paid).to.equal(true);
    });

    it("Не должен разрешать недостаточную сумму оплаты", async function () {
      await expect(yourContract.payInvoice(0, { value: "50000" })).to.be.revertedWith("Not enough ETH to pay invoice");
    });

    it("Не должен разрешать платить уже оплаченный инвойс", async function () {
      await yourContract.payInvoice(0, { value: invoiceAmount });
      await expect(yourContract.payInvoice(0, { value: invoiceAmount })).to.be.revertedWith("Invoice already paid");
    });

    it("Не должен разрешать оплату несуществующего инвойса", async function () {
      await expect(yourContract.payInvoice(99, { value: "1000000000000000000" })).to.be.revertedWith(
        "Invoice does not exist",
      );
    });
  });
});
