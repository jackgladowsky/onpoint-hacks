// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VulnerableContract
 * @dev This contract contains several security vulnerabilities for testing
 * WARNING: This is for testing only - contains intentional vulnerabilities!
 */
contract VulnerableContract {
    mapping(address => uint256) public balances;
    address public owner;
    bool private locked;
    
    constructor() {
        owner = msg.sender;
    }
    
    // Vulnerability 1: Missing access control
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Vulnerability 2: Reentrancy attack possible
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount; // State change after external call
    }
    
    // Vulnerability 3: Integer overflow (pre-0.8.0 style)
    function deposit() public payable {
        balances[msg.sender] += msg.value; // Could overflow in older versions
    }
    
    // Vulnerability 4: Unprotected function
    function emergencyWithdraw() public {
        // Anyone can call this!
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // Vulnerability 5: Gas limit issues
    function massTransfer(address[] memory recipients, uint256[] memory amounts) public {
        for (uint i = 0; i < recipients.length; i++) {
            // Unbounded loop - can run out of gas
            payable(recipients[i]).transfer(amounts[i]);
        }
    }
} 