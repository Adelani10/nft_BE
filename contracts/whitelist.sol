// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";


error Whitelist__ExceededMaxNumberOfWledAddress();
error Whitelist__AddressAlreadyWled();
error Whitelist__Not_Whitelisted();

contract Whitelist is Ownable {
    uint256 private immutable maxNumberOfWhitelistAddresses;
    uint256 public numberOfWhitelistedAddresses = 0;

    mapping(address => bool) public addressToWhitelisted;

    constructor(uint256 _max) {
        maxNumberOfWhitelistAddresses = _max;
    }

    function addWhitelist(address _address) public onlyOwner {
        if(addressToWhitelisted[_address]){
            revert Whitelist__AddressAlreadyWled();
        }

        if(numberOfWhitelistedAddresses >= maxNumberOfWhitelistAddresses) {
            revert Whitelist__ExceededMaxNumberOfWledAddress();
        }
        addressToWhitelisted[_address] = true;
        numberOfWhitelistedAddresses = numberOfWhitelistedAddresses + 1;
    }

    function removeWhitelist(address _address) public onlyOwner {
        if(!addressToWhitelisted[_address]){
            revert Whitelist__Not_Whitelisted();
        }
        addressToWhitelisted[_address] = false;
    }

    function getMaxAddress() public view returns (uint256) {
        return maxNumberOfWhitelistAddresses;
    }

    function getNumberWhitelistedAccounts() public view returns(uint256) {
        return numberOfWhitelistedAddresses;
    }

    function isAddressWhitelisted(address _address) public view returns(bool) {
        return addressToWhitelisted[_address];
    }
    
}
