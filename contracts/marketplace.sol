// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error Marketplace__PRICE_CANNOT_BE_ZERO();
error Marketplace__NOT_APPROVED();
error Marketplace__ALREADY_LISTED();
error Marketplace__NOT_OWNER();
error Marketplace__NOT_LISTED();
error Marketplace__PRICE_NOT_MET();
error Marketplace__NO_PROCEEDS();
error Marketplace__TRANSFER_FAILED();

contract Marketplace is ReentrancyGuard {
    // Events
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(address indexed lister, address indexed nftAddress, uint256 indexed tokenId);

    struct Listing {
        uint256 price;
        address seller;
    }

    // Mappings
    mapping(address => mapping(uint256 => Listing)) private s_listing;
    mapping(address => uint256) private s_proceeds;

    // Modifiers
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price > 0) {
            revert Marketplace__ALREADY_LISTED();
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address lister
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (lister != owner) {
            revert Marketplace__NOT_OWNER();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert Marketplace__NOT_LISTED();
        }
        _;
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert Marketplace__PRICE_CANNOT_BE_ZERO();
        }

        IERC721 nft = IERC721(nftAddress);

        if (nft.getApproved(tokenId) != address(this)) {
            revert Marketplace__NOT_APPROVED();
        }
        s_listing[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = s_listing[nftAddress][tokenId];

        if (msg.value < listedItem.price) {
            revert Marketplace__PRICE_NOT_MET();
        }

        s_proceeds[listedItem.seller] += msg.value;

        // Delete the listing
        delete (s_listing[nftAddress][tokenId]);

        // Transfer the NFT
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        delete (s_listing[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        require(newPrice > 0, "Price must be valuable");
        s_listing[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert Marketplace__NO_PROCEEDS();
        }
        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: proceeds}("");

        if (!success) {
            revert Marketplace__TRANSFER_FAILED();
        }
    }

    // Getters

    function getListing(address nftAddress, uint256 tokenId) public view returns (Listing memory) {
        return s_listing[nftAddress][tokenId];
    }

    function getProceeds(address _address) public view returns (uint256) {
        return s_proceeds[_address];
    }
}
