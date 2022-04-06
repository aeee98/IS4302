const Election = artifacts.require("Election");
const ElectionAdministrator = artifacts.require("ElectionAdministrator");
const ElectionPortal = artifacts.require("ElectionPortal");
const StringUtils = artifacts.require("util/StringUtils.sol");

async function doDeploy(deployer, network) {
    await deployer.deploy(ElectionAdministrator);
    await deployer.deploy(ElectionPortal, ElectionAdministrator.address);
    await deployer.deploy(StringUtils);
    await deployer.link(StringUtils, [Election]);
    await deployer.deploy(Election, "testElection", 2649227776, 3649227476, ElectionAdministrator.address);
}


module.exports = (deployer, network, accounts) => {
    deployer.then(async () => {
        await doDeploy(deployer, network);
    });
};