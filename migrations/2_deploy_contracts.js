const Election = artifacts.require("Election");
const ElectionAdministrator = artifacts.require("ElectionAdministrator");
const ElectionPortal = artifacts.require("ElectionPortal");
const StringUtils = artifacts.require("util/StringUtils.sol");

async function doDeploy(deployer, network) {
    await deployer.deploy(ElectionAdministrator).then(function() {
        return deployer.deploy(ElectionPortal, ElectionAdministrator.address);
    }).then(function() {
        return deployer.deploy(StringUtils);
    }).then(function() {
        return deployer.link(StringUtils, [Election]);
    }).then(function() {
        return deployer.deploy(Election, "testElection", Math.round(Date.now()/1000) + 3, Math.round(Date.now()/1000) + 4, ElectionAdministrator.address);
    });   
}

module.exports = (deployer, network) => {
    deployer.then(async () => {
        await doDeploy(deployer, network);
    });
};
