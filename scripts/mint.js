const { ethers, getNamedAccounts, deployments } = require("hardhat");


const mint = async () => {
  console.log("Setting up mint");
  await deployments.fixture(["all"])
  const deployer = (await getNamedAccounts()).deployer
  const whitelist = await ethers.getContract("Whitelist", deployer)
  const nft = await ethers.getContract("Nft", deployer)

  console.log("Adding address to whitelist...")
  const tx = await whitelist.addWhitelist()
  await tx.wait(1)
  console.log("Address added to whitelist")

  console.log("Minting...")
  const txResponse = await nft.mint()
  await txResponse.wait(1)
  const tokenId = await nft.tokenCounter()
  const tokenURI = await nft.tokenURI(tokenId)

  console.log("Minted!")
  console.log(`tokenURI is ${tokenURI}`)
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
