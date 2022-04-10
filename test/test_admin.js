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

    it("Test Admin Only Modifier", async () => {
        //let illegalAddAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[2], {from: accounts[5]});
        truffleAssert.reverts(ElectionAdministratorInstance.addAdministrator(accounts[2], {from: accounts[5]}), "Admin only");
    })

    it("Is Administrator: true", async () => {
        let adminTrueTest = await ElectionAdministratorInstance.isAdministrator(accounts[0]);
        assert.strictEqual(adminTrueTest, true)
    })

    it("Is Administrator: false", async () => {
        let adminTrueTest = await ElectionAdministratorInstance.isAdministrator(accounts[5]);
        assert.strictEqual(adminTrueTest, false)
    })

    it("Removing Admin Who Doesn't Exist", async () => {
        let removeNonAdmin = await ElectionAdministratorInstance.setPendingRemoval(accounts[5], {from: accounts[0]});
        truffleAssert.eventEmitted(removeNonAdmin, 'AdministratorDoesNotExist');
    })

    it("Set pending Removal", async () => {
        let addAdmin3 = await ElectionAdministratorInstance.addAdministrator(accounts[3], {from: accounts[0]});
        let legalAdminDualRemoval = await ElectionAdministratorInstance.setPendingRemoval(accounts[2], {from: accounts[3]});
        truffleAssert.eventEmitted(legalAdminDualRemoval, 'AdministratorSetPendingRemoval');
    })

    it("Admin Already pending Removal", async () => {
        let illegalAdminDualRemoval = await ElectionAdministratorInstance.setPendingRemoval(accounts[2], {from: accounts[3]});
        truffleAssert.eventEmitted(illegalAdminDualRemoval, 'AlreadyPendingRemoval');
    })

    it("Cannot approve Own Removal Request", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[2], {from: accounts[3]}), "You cannot approve a removal that you have made.");
    })

    it("Cannot remove yourself approval", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[3], {from: accounts[3]}), "You cannot approve or reject a removal of yourself");
    })

    it("Cannot remove yourself rejection", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.rejectRemoval(accounts[3], {from: accounts[3]}), "You cannot approve or reject a removal of yourself");
    })

    it("Not Pending Removal Yet: Approval", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[0], {from: accounts[3]}), "The administrator has not been set to pending removal yet");
    })

    it("Not Pending Removal Yet: Rejection", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.rejectRemoval(accounts[0], {from: accounts[3]}), "The administrator has not been set to pending removal yet");
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
        let removeAdmin2 = await ElectionAdministratorInstance.setPendingRemoval(accounts[1], {from: accounts[0]});
        await truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[1], {from: accounts[0]}), "You cannot approve a removal that you have made.");
    })

})