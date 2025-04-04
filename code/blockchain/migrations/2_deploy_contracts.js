const LoanManager = artifacts.require("LoanManager");
const BorrowerContract = artifacts.require("BorrowerContract");

module.exports = async function(deployer) {
  await deployer.deploy(LoanManager);
  const loanManager = await LoanManager.deployed();
  await deployer.deploy(BorrowerContract);
};