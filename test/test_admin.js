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

    it("Removing admin approval", async () => {
        let removeAdmin1 = await ElectionAdministratorInstance.setPendingRemoval(accounts[2], {from: accounts[1]});
        let approveRemove1 = await ElectionAdministratorInstance.approveRemoval(accounts[2], {from: accounts[0]});
        truffleAssert.eventEmitted(approveRemove1, 'AdministratorApprovedRemoval');
    })

    it("Removing admin rejection", async () => {
        let addAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[3], {from: accounts[0]});
        let removeAdmin = await ElectionAdministratorInstance.setPendingRemoval(accounts[3], {from: accounts[1]});
        let rejectRemove1 = await ElectionAdministratorInstance.rejectRemoval(accounts[3], {from: accounts[0]});
        truffleAssert.eventEmitted(rejectRemove1, 'AdministratorRejectRemoval');
    })

    it("cannot remove any more admins if <= 2 admins", async () => {
        //let addAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[3], {from: accounts[0]});
        let removeAdmin2 = await ElectionAdministratorInstance.setPendingRemoval(accounts[1], {from: accounts[0]});
        // try {
        //     await 
        // } catch(err) {
        //     Error = err
        // }
        // assert.strictEqual(Error.reason, 'You cannot approve a removal that you have made.');
        await truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[1], {from: accounts[0]}), "You cannot approve a removal that you have made.");
    })

    

})