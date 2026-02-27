const LoanManager = artifacts.require("LoanManager");

module.exports = function (deployer) {
  deployer.deploy(LoanManager);
};
