const Election = artifacts.require("Election");
const ElectionAdministrator = artifacts.require("ElectionAdministrator");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(ElectionAdministrator).then(function() {
      return deployer.deploy(Election, "vote", 10, 20, ElectionAdministrator.address); // dummy values to create election
    });
  };