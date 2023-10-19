// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;


error Whitelist__ExceededMaxNumberOfWledAddress();
error Whitelist__AddressAlreadyWled();


contract Whitelist {
    uint256 private immutable maxNumberOfWhitelistAddresses;
    uint256 public numberOfWhitelistedAddresses = 0;

    mapping(address => bool) public addressToWhitelisted;

    constructor(uint256 _max) {
        maxNumberOfWhitelistAddresses = _max;
    }

    function addWhitelist() public {
        if(addressToWhitelisted[msg.sender]){
            revert Whitelist__AddressAlreadyWled();
        }

        if(numberOfWhitelistedAddresses >= maxNumberOfWhitelistAddresses) {
            revert Whitelist__ExceededMaxNumberOfWledAddress();
        }
        addressToWhitelisted[msg.sender] = true;
        numberOfWhitelistedAddresses = numberOfWhitelistedAddresses + 1;
    }

    function getMaxAddress() public view returns (uint256) {
        return maxNumberOfWhitelistAddresses;
    }

    function getNumberWhitelistedAccounts() public view returns(uint256) {
        return numberOfWhitelistedAddresses;
    }
    
}
