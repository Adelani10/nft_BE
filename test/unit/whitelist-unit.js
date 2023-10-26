const { getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Whitelist", () => {
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
                  assert.equal(
                      maxNumberAddress.toString(),
                      networkConfig[chainId]["maxNumberOfWhitelists"],
                  )
              })
          })

          describe("addWhitelist", () => {
              it("adds an address to the whitelisted addresses mapping", async () => {
                  const accounts = await ethers.getSigners()

                  for (let i = 0; i < 10; i++) {
                      await whitelist.addWhitelist(accounts[i].address)
                  }

                  const res = await whitelist.getNumberWhitelistedAccounts()
                  assert.equal(res.toString(), "10")

                  await expect(whitelist.addWhitelist(accounts[10].address)).to.be.revertedWith(
                      "Whitelist__ExceededMaxNumberOfWledAddress()",
                  )
                  await expect(whitelist.addWhitelist(accounts[0].address)).to.be.revertedWith(
                      "Whitelist__AddressAlreadyWled()",
                  )
              })
          })

          describe("removeWhitelist", () => {
              it("reverts if address is not whitelisted and removes address from whitelists", async () => {
                  await expect(whitelist.removeWhitelist(deployer)).to.be.revertedWith(
                      "Whitelist__Not_Whitelisted()",
                  )
              })

              it("should remove an existing whitelist", async () => {
                  const tx = await whitelist.addWhitelist(deployer)
                  await tx.wait(1)
                  assert.equal(await whitelist.isAddressWhitelisted(deployer), true)
                  await whitelist.removeWhitelist(deployer)
                  assert.equal(await whitelist.isAddressWhitelisted(deployer), false)
              })

              it("reverts is anyone aside the deployer adds or removes whitelist", async () => {
                  const accounts = await ethers.getSigners()
                  const connectedAccount = whitelist.connect(accounts[1])
                  await expect(connectedAccount.addWhitelist(deployer)).to.be.reverted
                  await whitelist.addWhitelist(deployer)
                  await expect(connectedAccount.removeWhitelist(deployer)).to.be.reverted
              })
          })
      })
