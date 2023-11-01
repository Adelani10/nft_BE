const { ethers, getNamedAccounts, deployments } = require("hardhat")

const PRICE = ethers.utils.parseEther("0.02")

const mintAndList = async () => {
    console.log("Setting up mint")
    const deployer = (await getNamedAccounts()).deployer
    const whitelist = await ethers.getContractAt(
        "Whitelist",
        "0x0fdb1a2Fc4A58875050fdD16108c9F9aA7a9B481",
        deployer,
    )
    const nft = await ethers.getContractAt(
        "Nft",
        "0x67837b52083cbf282Be87fe1dC6dDE608B04f40a",
        deployer,
    )
    const marketplace = await ethers.getContractAt(
        "Marketplace",
        "0x3dc9ad753Aa8ae6ECb37f9258AA0Bb767BFC4374",
        deployer,
    )

    console.log("Adding address to whitelist...")
    const tx = await whitelist.addWhitelist(deployer)
    await tx.wait(1)
    console.log("Address added to whitelist")

    console.log("Minting...")
    const txRes = await nft.mint({ value: ethers.utils.parseEther("0.01") })
    const txRec = await txRes.wait(1)
    const tokenId = txRec.events[0].args.tokenId
    console.log("Minted!")

    console.log("approving")
    const res = await nft.approve(marketplace.address, 1)
    await res.wait(1)

    console.log("Listing")
    const txResponse = await marketplace.listItem(nft.address, 1, PRICE)
    await txResponse.wait(1)

    console.log("listed!!")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
