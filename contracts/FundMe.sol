// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error NotOwner();

contract FundMe {
  using PriceConverter for uint256;

  mapping(address => uint256) public addressToAmountFunded;
  address[] public funders;

  address public immutable iOwner;
  uint256 public constant MINIMUM_USD = 50 * 10**18;

  AggregatorV3Interface public priceFeed;

  constructor(address priceFeedAddress) {
    iOwner = msg.sender;
    priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  function fund() public payable {
    require(
      msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
      "Not enough funds spent!"
    );
    addressToAmountFunded[msg.sender] += msg.value;
    funders.push(msg.sender);
  }

  modifier onlyOwner() {
    if (msg.sender != iOwner) {
      revert NotOwner();
    }
    _;
  }

  function withdraw() public payable onlyOwner {
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      addressToAmountFunded[funder] = 0;
    }
    funders = new address[](0);

    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "call failed!");
  }

  fallback() external payable {
    fund();
  }

  receive() external payable {
    fund();
  }
}
