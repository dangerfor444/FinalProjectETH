// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
 
import "hardhat/console.sol";
 
/**
 * @title YourContract
 * @dev Контракт для создания и оплаты счетов (invoice).
 */
contract YourContract {
    /// @notice Счётчик созданных инвойсов
    uint256 public invoiceCount;
 
    /**
     * @dev Структура хранения данных об одном инвойсе:
     * @param recipient кому платим (адрес, который получит средства при оплате)
     * @param description текстовое описание, за что платим
     * @param amount сумма, которую надо оплатить (в wei)
     * @param paid флаг, оплачен ли инвойс
     */
    struct Invoice {
        address recipient;
        string description;
        uint256 amount;
        bool paid;
    }
 
    /// @dev Хранилище всех инвойсов
    mapping(uint256 => Invoice) public invoices;
 
    /// @dev События
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed recipient,
        uint256 amount,
        string description
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount
    );
    
    /**
     * @dev Конструктор 
     */
    constructor() {
        console.log("YourContract deployed");
    }
 
    /**
     * @notice Создать инвойс
     * @param _recipient адрес, которому платим
     * @param _description описание инвойса
     * @param _amount сумма в wei (1 ETH = 10^18 wei)
     * @return invoiceId уникальный ID созданного инвойса
     */
    function createInvoice(
        address _recipient,
        string memory _description,
        uint256 _amount
    ) external returns (uint256 invoiceId) {
        require(_recipient != address(0), "Recipient is zero address");
        require(_amount > 0, "Amount must be > 0");
 
        invoiceId = invoiceCount;
        invoices[invoiceId] = Invoice({
            recipient: _recipient,
            description: _description,
            amount: _amount,
            paid: false
        });
        invoiceCount++;
 
        emit InvoiceCreated(invoiceId, _recipient, _amount, _description);
        console.log("Invoice %s created for recipient %s, amount %s", invoiceId, _recipient, _amount);
    }
 
    /**
     * @notice Оплатить инвойс, отправив ETH на адрес, указанный при создании
     * @param _invoiceId ID инвойса
     */
    function payInvoice(uint256 _invoiceId) external payable {
        // Проверяем, существует ли инвойс (invoiceId < invoiceCount)
        require(_invoiceId < invoiceCount, "Invoice does not exist");
        Invoice storage inv = invoices[_invoiceId];
 
        require(!inv.paid, "Invoice already paid");
        require(msg.value >= inv.amount, "Not enough ETH to pay invoice");
 
        // Помечаем как оплаченный
        inv.paid = true;
 
        // Отправляем ETH получателю
        (bool success, ) = inv.recipient.call{value: msg.value}("");
        require(success, "Transfer failed");
 
        emit InvoicePaid(_invoiceId, msg.sender, msg.value);
        console.log("Invoice %s paid by %s, amount %s", _invoiceId, msg.sender, msg.value);
    }
 
    /**
     * @notice Фолбэк-функция, чтобы контракт мог принимать ETH напрямую
     */
    receive() external payable {
        console.log("Received ETH:", msg.value);
    }
 
    /**
     * @notice Для отладки: возвращает информацию об инвойсе
     */
    function getInvoice(uint256 _invoiceId)
        external
        view
        returns (
            address recipient,
            string memory description,
            uint256 amount,
            bool paid
        )
    {
        require(_invoiceId < invoiceCount, "Invoice does not exist");
        Invoice memory inv = invoices[_invoiceId];
        return (inv.recipient, inv.description, inv.amount, inv.paid);
    }
}