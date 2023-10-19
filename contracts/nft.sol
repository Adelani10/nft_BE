// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./whitelist.sol";
import "base64-sol/base64.sol";

error Nft__ExceededMaxSupply();
error Nft__AlreadyOwned();
error Nft__NotEnoughETH();
error Nft__URI_FOR_NONEXISTENCE_TOKEN();

contract Nft is ERC721Enumerable, Ownable {
    uint256 private immutable maxNumberOfTokens;
    uint256 private immutable PRICE;
    uint256 public tokenCounter;
    Whitelist whitelist;

    uint256 public reservedTokens;
    uint256 public reservedTokensClaimed = 0;
    string imageURI;

    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";

    event itemMinted(address indexed minter, uint256 indexed tokenId);

    constructor(
        uint256 _maxNumberOfNfts,
        uint256 _price,
        address whitelistContractAddress,
        string memory imageSvg
    ) ERC721("Duckio", "DCK") {
        maxNumberOfTokens = _maxNumberOfNfts;
        PRICE = _price;
        whitelist = Whitelist(whitelistContractAddress);
        imageURI = svgToImageURI(imageSvg);
        tokenCounter = 0;
        reservedTokens = whitelist.getMaxAddress();
    }

    function svgToImageURI(string memory _svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(_svg))));
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        if (!_exists(_tokenId)) {
            revert Nft__URI_FOR_NONEXISTENCE_TOKEN();
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"A duck signalling goodluck!", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function mint() public payable {
        if (maxNumberOfTokens < totalSupply() + reservedTokens - reservedTokensClaimed) {
            revert Nft__ExceededMaxSupply();
        }

        if (whitelist.addressToWhitelisted(msg.sender) && msg.value < PRICE) {
            if (balanceOf(msg.sender) > 0) {
                revert Nft__AlreadyOwned();
            }
            reservedTokensClaimed += 1;
        } else {
            if (PRICE > msg.value) {
                revert Nft__NotEnoughETH();
            }
        }
        tokenCounter += 1;
        _safeMint(msg.sender, tokenCounter);
        emit itemMinted(msg.sender, tokenCounter);
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;

        (bool success, ) = _owner.call{value: amount}("");

        require(success, "Failed to send ether");
    }

    // GETTERS

    function getMaxNumberOfTokens() public view returns (uint256) {
        return maxNumberOfTokens;
    }

    function getPrice() public view returns (uint256) {
        return PRICE;
    }

    function getWhitelistAddress() public view returns (Whitelist) {
        return whitelist;
    }

    function getImageUri() public view returns (string memory) {
        return imageURI;
    }

    function getReservedTokens() public view returns (uint256) {
        return reservedTokens;
    }


}
