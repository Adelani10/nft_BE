const { getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains, maxNumber, networkConfig } = require("../../helper-hardhat-config");
const {assert, expect} = require("chai")

!developmentChains.includes(network.name) ? describe.skip : describe("Nft", () => {
    let nft, deployer, whitelist
    const chainId = network.config.chainId
    const MINT_FEE = ethers.utils.parseEther("0.01")

    beforeEach(async () => {
        await deployments.fixture(["all"])
        deployer = (await getNamedAccounts()).deployer
        nft = await ethers.getContract("Nft", deployer)
        whitelist = await ethers.getContract("Whitelist")
    })
    describe("constructor", () => {
        it("initializes the contract correctly", async () => {
            const res = await nft.getMaxNumberOfTokens()
            const price = await nft.getPrice()
            const whiitelistAddress = await nft.getWhitelistAddress()
            const imageUri = await nft.getImageUri()
            const reservedTokens = await nft.getReservedTokens()
            const response = await whitelist.getMaxAddress()
            assert.equal(res.toString(), networkConfig[chainId]["maxNumberOfNfts"])
            assert.equal(price.toString(), networkConfig[chainId]["price"])
            assert.equal(whiitelistAddress, whitelist.address)
            assert(imageUri.includes("data:image/svg+xml;base64,"), true)
            assert.equal(reservedTokens.toString(), response.toString())
        })
    })

    describe("tokenURI", () => {

        beforeEach(async () => {
            const txResponse = await nft.mint({value: MINT_FEE})
            await txResponse.wait(1)
        })

        it("returns the correct tokenURI", async () => {
            const res = await nft.tokenURI(1)
            console.log(res)
            console.log(await nft.getImageUri())
            assert(res.includes("data:application/json;base64,"), true)
        })

        it("reverts if tokenId does not exist", async () => {
            await expect(nft.tokenURI(3)).to.be.revertedWith("Nft__URI_FOR_NONEXISTENCE_TOKEN()")
        })
    })

    describe("mint", () => {
        it("reserves spots for wl holders ", async () => {
            const accounts = await ethers.getSigners()

            for(let i = 0; i < 10; i++) {
                const connectedAccount = await nft.connect(accounts[i])
                await connectedAccount.mint({value: MINT_FEE})
            }

            newConnectAccount = await nft.connect(accounts[10])
            await expect(newConnectAccount.mint({value: MINT_FEE})).to.be.revertedWith("Nft__ExceededMaxSupply()")
        })

        it("updates the reservedTokensClaimed && reverts if you don't send enough ETH, or you already own an NFT", async () => {
            await expect(nft.mint()).to.be.revertedWith("Nft__NotEnoughETH()")
            await whitelist.addWhitelist(deployer)
            await nft.mint()
            const res = await nft.reservedTokensClaimed()
            assert.equal(res.toString(), "1")
            await expect(nft.mint()).to.be.revertedWith("Nft__AlreadyOwned()")
        })

        it("updates the tokenCounter and emits an event after minting", async () => {
            await expect(nft.mint({value: MINT_FEE})).to.emit(nft, "itemMinted")

            const res = await nft.tokenCounter()
            assert.equal(res.toString(), "1")
        })
    })

    describe("withdraw", () => {
        it("sends all the generated funds to the owner of the nft", async () => {
            const startingDeployerBalance = await nft.provider.getBalance(deployer)

            const accounts = await ethers.getSigners()
            const numberOfMinters = 10
            for(let i = 1; i <= numberOfMinters; i++) {
                const connectedAccount = await nft.connect(accounts[i])
                await connectedAccount.mint({value: MINT_FEE})
            }
            
            const res = await nft.withdraw()
            const txReceipt = await res.wait(1)

            const {gasUsed, effectiveGasPrice} = txReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const closingDeployerBalance = await nft.provider.getBalance(deployer)
            const sum = startingDeployerBalance.add(MINT_FEE.mul(numberOfMinters))

            assert.equal(sum.toString(), closingDeployerBalance.add(gasCost).toString())
        })
    })
})