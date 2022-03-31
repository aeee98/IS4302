const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require("truffle-assertions");
var assert = require("assert");

var ElectionAdministrator = artifacts.require("../contracts/ElectionAdministrator.sol");

contract("ElectionAdministrator", function(accounts) {
    before(async () => {
        ElectionAdministratorInstance = await ElectionAdministrator.deployed();
    });
    console.log("Testing ElectionAdmin Contract");

    it("Test Admin Addition after deployment", async () => {
        let addAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[2], {from: accounts[0]});
        truffleAssert.eventEmitted(addAdmin, 'AdministratorAdded');
    })

    it("Test Admin Addition after admin had been added", async () => {
        let addAdmin2 = await ElectionAdministratorInstance.addAdministrator(accounts[1], {from: accounts[2]});
        truffleAssert.eventEmitted(addAdmin2, 'AdministratorAdded');
    })

    it("Adding Already Existing admin", async () => {
        let addAdmin3 = await ElectionAdministratorInstance.addAdministrator(accounts[1], {from: accounts[2]});
        truffleAssert.eventEmitted(addAdmin3, 'AdministratorAlreadyExists');
    })
})