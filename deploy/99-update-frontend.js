const { network, ethers } = require("hardhat")
const fs = require("fs")
require("dotenv").config()

const CA_FILE = "../nft-fe/constants/contractAddresses.json"
const NFT_ABI_FILE = "../nft-fe/constants/nftAbi.json"
const WHITELIST_ABI_FILE = "../nft-fe/constants/whitelistAbi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END === "true") {
        console.log("Writing to frontend...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Frontend updated successfully")
    }
}

const updateAbi = async () => {
    const nft = await ethers.getContract("Nft")
    const whitelist = await ethers.getContract("Whitelist")
    fs.writeFileSync(NFT_ABI_FILE, nft.interface.format(ethers.utils.FormatTypes.json))
    fs.writeFileSync(WHITELIST_ABI_FILE, whitelist.interface.format(ethers.utils.FormatTypes.json))
}

const updateContractAddresses = async () => {
    const nft = await ethers.getContract("Nft")
    const whitelist = await ethers.getContract("Whitelist")
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(CA_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId]["Nft"].includes(nft.address)) {
            currentAddresses[chainId]["Nft"].push(nft.address)
        }
        if (!currentAddresses[chainId]["Whitelist"].includes(whitelist.address)) {
            currentAddresses[chainId]["Whitelist"].push(whitelist.address)
        }
    } else {
        currentAddresses[chainId]["Nft"]= [nft.address]
        currentAddresses[chainId]["Whitelist"]= [whitelist.address]
    }

    fs.writeFileSync(CA_FILE, JSON.stringify(currentAddresses))
}
