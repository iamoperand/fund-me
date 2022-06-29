const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

describe("FundMe", async function () {
  const fundedValue = ethers.utils.parseEther("1")
  let fundMe
  let deployer
  let mockV3Aggregator

  beforeEach(async function () {
    // deploy "FundMe" contract using hardhat-deploy
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])

    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })

  describe("constructor", async function () {
    it("sets the aggregator addresses correctly", async function () {
      const response = await fundMe.priceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe("fund", async function () {
    it("fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })

    it("updates the amount funded data structure", async function () {
      await fundMe.fund({ value: fundedValue })
      const response = await fundMe.addressToAmountFunded(deployer)
      assert.equal(response.toString(), fundedValue.toString())
    })

    it("adds funder to funders array", async function () {
      await fundMe.fund({ value: fundedValue })
      const funder = await fundMe.funders(0)
      assert.equal(funder, deployer)
    })
  })

  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: fundedValue })
    })

    it("withdraw ETH from a single founder", async function () {
      // arrange
      const startingContractBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingContractBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // assert
      assert.equal(endingContractBalance, 0)
      assert.equal(
        startingContractBalance.add(startingDeployerBalance),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
  })
})