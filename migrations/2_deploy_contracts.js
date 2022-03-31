const Election = artifacts.require("Election");
const ElectionAdministrator = artifacts.require("ElectionAdministrator");
const ElectionPortal = artifacts.require("ElectionPortal");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(ElectionAdministrator).then(function() {
        deployer.deploy(ElectionPortal, ElectionAdministrator.address);
        return deployer.deploy(Election, "testElection", 2648563896, 3648563896, ElectionAdministrator.address);
    });
};