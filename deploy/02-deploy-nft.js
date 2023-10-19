const { network } = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")
require("dotenv").config()
const fs = require("fs")


const imageSvgLocation = `./nft-images/duck-${Math.floor(Math.random() * 20) + 1}.svg`
const imageSvg = fs.readFileSync(imageSvgLocation, {encoding: "utf8"})

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId
    let whitelistAddress

    log("----------------------------------------------------------------")
    log("deploying, pls wait..")

    const whitelist = await ethers.getContract("Whitelist")
    whitelistAddress = whitelist.address
    
    const args = [
        networkConfig[chainId]["maxNumberOfNfts"],
        networkConfig[chainId]["price"],
        whitelistAddress,
        imageSvg
    ]
    const nft = await deploy("Nft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 5
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        console.log("Verifying...")
        await verify(nft.address, args)
        log("Verified!")
    }

    log("Deployed")
    log("--------------------------------")
}

module.exports.tags = ["all", "nft"]