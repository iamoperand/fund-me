const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

describe("FundMe", async function () {
  const sendValue = ethers.utils.parseEther("1")
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
      const response = await fundMe.s_priceFeed()
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
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.s_addressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })

    it("adds funder to funders array", async function () {
      await fundMe.fund({ value: sendValue })
      const funder = await fundMe.s_funders(0)
      assert.equal(funder, deployer)
    })
  })

  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue })
    })

    it("allows us to withdraw with single funder", async function () {
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

    it("allows us to withdraw with multiple funders", async function () {
      // arrange
      const accounts = await ethers.getSigners()

      for (let index = 0; index < 5; index++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[index])
        await fundMeConnectedContract.fund({ value: sendValue })
      }

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

      await expect(fundMe.s_funders(0)).to.be.reverted
      for (let index = 0; index < 5; index++) {
        assert.equal(
          await fundMe.s_addressToAmountFunded(accounts[index].address),
          0
        )
      }
    })

    it("only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]

      const attackerConnectedContract = await fundMe.connect(attacker)
      await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
        "FundMe__NotOwner"
      )
    })
  })

  describe("cheaperWithdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue })
    })

    it("allows us to cheaperWithdraw with single funder", async function () {
      // arrange
      const startingContractBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // act
      const transactionResponse = await fundMe.cheaperWithdraw()
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

    it("allows us to cheaperWithdraw with multiple funders", async function () {
      // arrange
      const accounts = await ethers.getSigners()

      for (let index = 0; index < 5; index++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[index])
        await fundMeConnectedContract.fund({ value: sendValue })
      }

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

      await expect(fundMe.s_funders(0)).to.be.reverted
      for (let index = 0; index < 5; index++) {
        assert.equal(
          await fundMe.s_addressToAmountFunded(accounts[index].address),
          0
        )
      }
    })

    it("only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]

      const attackerConnectedContract = await fundMe.connect(attacker)
      await expect(
        attackerConnectedContract.cheaperWithdraw()
      ).to.be.revertedWith("FundMe__NotOwner")
    })
  })
})
