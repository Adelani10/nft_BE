const { getNamedAccounts, deployments } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");
const {assert, expect} = require("chai")

!developmentChains.includes(network.name) ? describe.skip : describe("Whitelist", () => {
    let whitelist, deployer
    const chainId = network.config.chainId
    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["whitelist"])
        whitelist = await ethers.getContract("Whitelist")
    })

    describe("constructor", () => {
        it("initializes the max number of addresses to be whitelisted", async () => {
            const maxNumberAddress = await whitelist.getMaxAddress()
            assert.equal(maxNumberAddress.toString(), networkConfig[chainId]["maxNumberOfWhitelists"])
        })
    })

    describe("addWhitelist", () => {
        it("adds an address to the whitelisted addresses mapping", async () => {
            const accounts = await ethers.getSigners()

            for (let i = 0; i < 10; i++){
                const connectedAccount = whitelist.connect(accounts[i])
                await connectedAccount.addWhitelist()

                await expect(whitelist.connect(accounts[0]).addWhitelist()).to.be.revertedWith("Whitelist__AddressAlreadyWled()")
            }

            const res = await whitelist.getNumberWhitelistedAccounts()

            assert.equal(res.toString(), "10")

            await expect(whitelist.connect(accounts[10]).addWhitelist()).to.be.revertedWith("Whitelist__ExceededMaxNumberOfWledAddress()")

        })
    })
})