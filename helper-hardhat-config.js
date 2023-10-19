const { ethers } = require("hardhat");

const networkConfig = {
    11155111: {
        name: "sepolia",
        maxNumberOfWhitelists: 10,
        maxNumberOfNfts: 20,
        price: ethers.utils.parseEther("0.01"),
        
    },
    31337: {
        name: "hardhat",
        maxNumberOfWhitelists: 10,
        maxNumberOfNfts: 20,
        price: ethers.utils.parseEther("0.01"),
    }
}


const developmentChains = ["hardhat", "localhost"]


module.exports = { developmentChains, networkConfig }