const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Marketplace", () => {
          let marketplace, nft, deployer
          const MINT_FEE = ethers.utils.parseEther("0.01")
          const TOKEN_ID = 1
          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              await deployments.fixture(["all"]), (deployer = accounts[0])
              player = accounts[1]
              marketplace = await ethers.getContract("Marketplace", deployer)
              playerConnectedContract = marketplace.connect(player)
              nft = await ethers.getContract("Nft", deployer)
              const txRes = await nft.mint({ value: MINT_FEE })
              await txRes.wait(1)
              await nft.approve(marketplace.address, TOKEN_ID)
          })
          describe("listItem", () => {
              it("reverts if not the owner address tries to call the list function or is already listed", async () => {
                  await expect(
                      playerConnectedContract.listItem(nft.address, TOKEN_ID, MINT_FEE),
                  ).to.be.revertedWith("Marketplace__NOT_OWNER()")

                  await marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)
                  await expect(
                      marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE),
                  ).to.be.revertedWith("Marketplace__ALREADY_LISTED()")
              })
              it("should revert if listing price <= 0", async () => {
                  await expect(
                      marketplace.listItem(nft.address, TOKEN_ID, ethers.utils.parseEther("0")),
                  ).to.be.revertedWith("Marketplace__PRICE_CANNOT_BE_ZERO()")
              })
              it("succesfully lists an item and emits an event", async () => {
                  await expect(marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)).to.emit(
                      marketplace,
                      "ItemListed",
                  )
                  console.log("ok")
                  const res = await marketplace.getListing(nft.address, TOKEN_ID)
                  assert.equal(res.seller, deployer.address)
                  assert.equal(res.price.toString(), MINT_FEE.toString())
              })
          })

          describe("buyItem", () => {
              it("reverts if the item is not listed", async () => {
                  await expect(
                      playerConnectedContract.buyItem(nft.address, TOKEN_ID, {value: MINT_FEE}),
                  ).to.be.revertedWith("Marketplace__NOT_LISTED()")
              })
              it("reverts if the price is not met", async () => {
                  await marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)
                  await expect(
                      playerConnectedContract.buyItem(nft.address, TOKEN_ID),
                  ).to.be.revertedWith("Marketplace__PRICE_NOT_MET()")
              })
              it("updates the proceeds of the seller, deletes the listing & emits an event", async () => {
                  await marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)
                  await expect(
                      playerConnectedContract.buyItem(nft.address, TOKEN_ID, { value: MINT_FEE }),
                  ).to.emit(marketplace, "ItemBought")
                  assert((await marketplace.getListing(nft.address, TOKEN_ID).seller) === undefined)
                  const res = await marketplace.getProceeds(deployer.address)
                  assert.equal(res.toString(), MINT_FEE.toString())
              })
          })

          describe("cancelListing", () => {
              it("cancels a listing and emits an event", async () => {
                  const res = await marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)
                  await res.wait(1)
                  await expect(marketplace.cancelListing(nft.address, TOKEN_ID)).to.emit(
                      marketplace,
                      "ItemCanceled",
                  )
                  assert((await marketplace.getListing(nft.address, TOKEN_ID).price) === undefined)
              })
          })

          describe("updateListing", () => {
              beforeEach(async () => {
                  const res = await marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)
                  await res.wait(1)
              })

              it("reverts if new price is set to 0", async () => {
                  await expect(
                      marketplace.updateListing(
                          nft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0"),
                      ),
                  ).to.be.revertedWith("Marketplace__PRICE_CANNOT_BE_ZERO()")
              })

              it("updates the price of a listing successfully and emits an event", async () => {
                  await expect(
                      marketplace.updateListing(
                          nft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.02"),
                      ),
                  ).to.emit(marketplace, "ItemListed")
                  const res = await marketplace.getListing(nft.address, TOKEN_ID)
                  assert.equal(res.price.toString(), ethers.utils.parseEther("0.02").toString())
              })
          })

          describe("withdrawProceeds", () => {
              beforeEach(async () => {
                  const res = await marketplace.listItem(nft.address, TOKEN_ID, MINT_FEE)
                  await res.wait(1)
              })
              it("reverts if there are no proceeds", async () => {
                  await expect(marketplace.withdrawProceeds()).to.be.revertedWith(
                      "Marketplace__NO_PROCEEDS()",
                  )
              })
              it("withdraws the sellers proceeds succefully", async () => {
                  const startingSellerBalance = await ethers.provider.getBalance(deployer.address)

                  const res = await playerConnectedContract.buyItem(nft.address, TOKEN_ID, {
                      value: MINT_FEE,
                  })
                  await res.wait(1)

                  const response = await marketplace.withdrawProceeds()
                  const receipt = await response.wait(1)

                  const { gasUsed, effectiveGasPrice } = receipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingSellerBalance = await ethers.provider.getBalance(deployer.address)
                  assert.equal(
                      endingSellerBalance.add(gasCost).toString(),
                      startingSellerBalance.add(MINT_FEE).toString(),
                  )
              })
          })
      })
