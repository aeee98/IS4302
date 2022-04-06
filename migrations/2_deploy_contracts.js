const Election = artifacts.require("Election");
const ElectionAdministrator = artifacts.require("ElectionAdministrator");
const ElectionPortal = artifacts.require("ElectionPortal");
var StringUtils = artifacts.require("./StringUtils.sol");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(StringUtils);
    deployer.link(StringUtils, Election);
    //deployer.deploy(SaveData);
    deployer.deploy(ElectionAdministrator).then(function() {
        deployer.deploy(ElectionPortal, ElectionAdministrator.address);
        return deployer.deploy(Election, "testElection", 2648563896, 3648563896, ElectionAdministrator.address);
    });
};