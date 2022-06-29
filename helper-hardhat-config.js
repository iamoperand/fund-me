const networkConfig = {
  31337: {
    name: "hardhat",
  },
  4: {
    name: "rinkeby",
    ethUsdPriceFeedAddress: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
  },
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 2000 * 10 ** 8

module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
}
