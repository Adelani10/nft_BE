const { network } = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")
require("dotenv").config()


module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------------------")
    log("Deploying whitelist, please wait...")

    console.log(networkConfig[chainId]["maxNumberOfWhitelists"])

    const args = [networkConfig[chainId]["maxNumberOfWhitelists"]]
    const whitelist = await deploy("Whitelist", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 5
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        console.log("Verifying...")
        await verify(whitelist.address, args)
        log("Verified!")
    }
}

module.exports.tags = ["all", "whitelist"]