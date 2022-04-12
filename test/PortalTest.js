const _deploy_contracts = require("../migrations/2_deploy_contracts.js");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');
const { syncBuiltinESMExports } = require("module");
const time = require('@openzeppelin/test-helpers'); // pip install --save-dev @openzeppelin/test-helpers

var ElectionPortal = artifacts.require("../contracts/ElectionPortal.sol");
var ElectionAdministrator = artifacts.require("../contracts/ElectionAdministrator.sol");
var Election = artifacts.require("../contracts/Election.sol");

/* ElectionPortal.js Tests */
contract('ElectionPortal', function(accounts) {
    before(async () => {
        electionAdminInstance = await ElectionAdministrator.deployed();
        electionInstance = await Election.deployed();
        electionPortalInstance = await ElectionPortal.deployed();
    });

    it('Test Must Add Election First', async() => {
        await truffleAssert.reverts(electionPortalInstance.getLatestElection(), "Election does not exist");
    });

    it('Test Add Election', async() => {
        let addElection = await electionPortalInstance.addNewElection(electionInstance.address, 2022);
        truffleAssert.eventEmitted(addElection, "ElectionAdded");
    });

    it('Test Can View Election', async() => {
        let getElection = await electionPortalInstance.getElection(2022);
        assert.equal(getElection, electionInstance.address);
    });

    it('Test Invalid Election Reverts', async() => {
        await truffleAssert.reverts(electionPortalInstance.getElection(500), "Election does not exist");
    });

    it('Test Can View Latest Election', async() => {
        let lastestElection = await electionPortalInstance.getLatestElection();
        assert.equal(lastestElection, electionInstance.address);
    });

    // sleep code (no longer needed for portal, but leaving here just in case)
    // source for sleep code: https://blog.devgenius.io/how-to-make-javascript-sleep-or-wait-d95d33c99909
    // const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
});

/* Election Administrator Tests */
contract("ElectionAdministrator", function(accounts) {
    before(async () => {
        ElectionAdministratorInstance = await ElectionAdministrator.deployed();
    });
    console.log("Testing ElectionAdmin Contract");

    it("Test Admin Addition after deployment", async () => {
        let addAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[2], {from: accounts[0]});
        truffleAssert.eventEmitted(addAdmin, 'AdministratorAdded');
    });

    it("Test Admin Only Modifier", async () => {
        //let illegalAddAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[2], {from: accounts[5]});
        truffleAssert.reverts(ElectionAdministratorInstance.addAdministrator(accounts[2], {from: accounts[5]}), "Admin only");
    });

    it("Is Administrator: true", async () => {
        let adminTrueTest = await ElectionAdministratorInstance.isAdministrator(accounts[0]);
        assert.strictEqual(adminTrueTest, true)
    });

    it("Is Administrator: false", async () => {
        let adminTrueTest = await ElectionAdministratorInstance.isAdministrator(accounts[5]);
        assert.strictEqual(adminTrueTest, false)
    });

    it("Removing Admin Who Doesn't Exist", async () => {
        let removeNonAdmin = await ElectionAdministratorInstance.setPendingRemoval(accounts[5], {from: accounts[0]});
        truffleAssert.eventEmitted(removeNonAdmin, 'AdministratorDoesNotExist');
    });

    it("Set pending Removal", async () => {
        let addAdmin3 = await ElectionAdministratorInstance.addAdministrator(accounts[3], {from: accounts[0]});
        let legalAdminDualRemoval = await ElectionAdministratorInstance.setPendingRemoval(accounts[2], {from: accounts[3]});
        truffleAssert.eventEmitted(legalAdminDualRemoval, 'AdministratorSetPendingRemoval');
    });

    it("Admin Already pending Removal", async () => {
        let illegalAdminDualRemoval = await ElectionAdministratorInstance.setPendingRemoval(accounts[2], {from: accounts[3]});
        truffleAssert.eventEmitted(illegalAdminDualRemoval, 'AlreadyPendingRemoval');
    });

    it("Cannot approve Own Removal Request", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[2], {from: accounts[3]}), "You cannot approve a removal that you have made.");
    });

    it("Cannot remove yourself approval", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[3], {from: accounts[3]}), "You cannot approve or reject a removal of yourself");
    });

    it("Cannot remove yourself rejection", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.rejectRemoval(accounts[3], {from: accounts[3]}), "You cannot approve or reject a removal of yourself");
    });

    it("Not Pending Removal Yet: Approval", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[0], {from: accounts[3]}), "The administrator has not been set to pending removal yet");
    });

    it("Not Pending Removal Yet: Rejection", async () => {
        truffleAssert.reverts(ElectionAdministratorInstance.rejectRemoval(accounts[0], {from: accounts[3]}), "The administrator has not been set to pending removal yet");
    });

    it("Test Admin Addition after admin had been added", async () => {
        let addAdmin2 = await ElectionAdministratorInstance.addAdministrator(accounts[1], {from: accounts[2]});
        truffleAssert.eventEmitted(addAdmin2, 'AdministratorAdded');
    });

    it("Adding Already Existing admin", async () => {
        let addAdmin3 = await ElectionAdministratorInstance.addAdministrator(accounts[1], {from: accounts[2]});
        truffleAssert.eventEmitted(addAdmin3, 'AdministratorAlreadyExists');
    });

    it("Removing admin approval", async () => {
        let removeAdmin1 = await ElectionAdministratorInstance.setPendingRemoval(accounts[2], {from: accounts[1]});
        let approveRemove1 = await ElectionAdministratorInstance.approveRemoval(accounts[2], {from: accounts[0]});
        truffleAssert.eventEmitted(approveRemove1, 'AdministratorApprovedRemoval');
    });

    it("Removing admin rejection", async () => {
        let addAdmin = await ElectionAdministratorInstance.addAdministrator(accounts[3], {from: accounts[0]});
        let removeAdmin = await ElectionAdministratorInstance.setPendingRemoval(accounts[3], {from: accounts[1]});
        let rejectRemove1 = await ElectionAdministratorInstance.rejectRemoval(accounts[3], {from: accounts[0]});
        truffleAssert.eventEmitted(rejectRemove1, 'AdministratorRejectRemoval');
    });

    it("cannot remove any more admins if <= 2 admins", async () => {
        let removeAdmin2 = await ElectionAdministratorInstance.setPendingRemoval(accounts[1], {from: accounts[0]});
        await truffleAssert.reverts(ElectionAdministratorInstance.approveRemoval(accounts[1], {from: accounts[0]}), "You cannot approve a removal that you have made.");
    });

});

/* Election.js tests */
contract('Election', function(accounts) {

    var addCandidate1;
    var addRegion1;

    before(async () => {
        electionAdminInstance = await ElectionAdministrator.deployed();
        electionInstance = await Election.deployed();
        electionPortalInstance = await ElectionPortal.deployed();
    });
    console.log("Testing Election Contract");

    it('Add Candidate', async () => {
        addCandidate1 = await electionInstance.addCandidate("John", 1, "vote", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add candidate"
        );
    });

    it('Add Region', async () => {
        
        addRegion1 = await electionInstance.addRegion("Bukit Timah", "vote", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add region"
        );
    });

    // WIP
    it('Authenticate Voter', async () => {

        var authenticateVoter1 = await electionInstance.authenticateVoter("S12345678A", "password", {from: accounts[0]});

    });

    it('Vote', async () => {
        
        // test normal vote
        let vote1 = await electionInstance.vote(electionInstance.getVoteCodes[0], 1, {from: accounts[1]});
        // test vote with invalid voteCode
        let vote2 = async () => {
            electionInstance.setVoteCodes(electionInstance.getVoteCodes().push(0));
            electionInstance.vote(electionInstance.getVoteCodes[1], 1, {from: accounts[2]});
        }
        // test vote when already voted
        let vote3 = await electionInstance.vote(electionInstance.getVoteCodes[0], 1, {from: accounts[1]});
        // test vote for invalid candidate
        let vote4 = await electionInstance.vote(electionInstance.getVoteCodes[0], 10, {from: accounts[2]});
        // vote cannot be cast after election ended
        let vote5 = async() => {
            time.increaseTo(electionInstance.getEndDate())
            electionInstance.endElection({from: accounts[1]})
            electionInstance.vote(electionInstance.getVoteCodes[0], 10, {from: accounts[2]})
        };

        assert.notStrictEqual(
            vote1,
            undefined,
            "Failed to cast vote"
        );

        await truffleAssert.reverts(
            vote2,
            undefined,
            'Invalid voteCode'
        );

        await truffleAssert.reverts(
            vote3,
            undefined,
            'Account has already voted'
        );

        await truffleAssert.reverts(
            vote4,
            undefined,
            'Invalid candidateId'
        );

        await truffleAssert.reverts(
            vote5,
            undefined,
            'Election has already ended, vote cannot be cast'
        );

    });

    // adminOnly modifier is tested here and will not be tested in subsequent unit tests
    it('Change start date', async() => {

        let changeStartDate1 = await electionInstance.changeStartDate(100, {from: accounts[0]});
        // accounts[2] is not admin
        let changeStartDate2 = await electionInstance.changeStartDate(100, {from: accounts[2]});
        // start date passed
        let changeStartDate3 = await electionInstance.changeStartDate(0, {from: accounts[0]});

        assert.notStrictEqual(
            changeStartDate1,
            undefined,
            "Failed to change start date"
        );

        await truffleAssert.reverts(
            changeStartDate2,
            undefined,
            'Not admin account'
        );

        await truffleAssert.reverts(
            changeStartDate3,
            undefined,
            'New start date has already passed'
        );

    });

    it('Change end date', async() => {

        let changeEndDate1 = await electionInstance.changeEndDate(200, {from: accounts[0]});
        // end date before start date
        let changeEndDate2 = await electionInstance.changeEndDate(20, {from: accounts[0]});

        assert.notStrictEqual(
            changeEndDate1,
            undefined,
            "Failed to change end date"
        );

        await truffleAssert.reverts(
            changeEndDate2,
            undefined,
            'New end date cannot be before start date'
        );
    });

    it('Start election', async() => {
        
        // start date not yet reached
        let startElection1 = await electionInstance.startElection({from: accounts[0]});
        // election started
        let startElection2 = async() => {
            time.increaseTo(electionInstance.getStartDate({from: accounts[0]})); // set any timestamp in here
            electionInstance.startElection({from: accounts[0]});
        }
        // election already started
        let startElection3 = await electionInstance.startElection({from: accounts[0]});

        await truffleAssert.reverts(
            startElection1,
            undefined,
            'Start date not yet reached'
        );
        
        assert.notStrictEqual(
            startElection2,
            undefined,
            "Failed to start election"
        );

        await truffleAssert.reverts(
            startElection1,
            undefined,
            'Election already started'
        );

    });

    it('End election', async() => {

        // end date not yet reached
        let endElection1 = await electionInstance.endElection({from: accounts[0]})
        // election ended
        let endElection2 = async() => {
            time.increaseTo(electionInstance.getEndDate({from: accounts[0]}));
            electionInstance.endElection({from: accounts[0]});
        } 
        // election already ended
        let endElection3 = await electionInstance.endElection({from: accounts[0]});

        await truffleAssert.reverts(
            endElection1,
            undefined,
            'End date not yet reached'
        );
        assert.notStrictEqual(
            endElection2,
            undefined,
            "Failed to end election"
        );

        await truffleAssert.reverts(
            endElection3,
            undefined,
            'Election already ended'
        );

    });

    it('Settle results', async() => {

        // election not yet ended
        let settleResults1 = await electionInstance.settleResults({from: accounts[0]});
        // settle results
        let settleResults2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}));
            electionInstance.endElection({from: accounts[0]});
            electionInstance.settleResults({from: accounts[0]});
        }
        // results already settled
        let settleResults3 = await electionInstance.settleResults({from: accounts[0]});


        await truffleAssert.reverts(
            settleResults1,
            undefined,
            'Election not yet ended'
        );

        assert.notStrictEqual(
            settleResults2,
            undefined,
            "Failed to settle results"
        );

        await truffleAssert.reverts(
            settleResults3,
            undefined,
            'Results already settled'
        );

    });

    it('Get winner', async() => {

        // election not yet ened
        let getWinner1 = await electionInstance.getWinner({from: accounts[0]});
        // results not yet settled, valid region
        let getWinner2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}));
            electionInstance.endElection({from: accounts[0]});
            electionInstance.getWinner('Bukit Timah', {from: accounts[0]}); // placeholder region name
        }
        // results settled, invalid region
        let getWinner3 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}));
            electionInstance.endElection({from: accounts[0]});
            electionInstance.settleResults({from: accounts[0]});
            electionInstance.getWinner('Woodlands', {from: accounts[0]});// placeholder region name
        }
        // get winner
        let getWinner4 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}));
            electionInstance.endElection({from: accounts[0]});
            electionInstance.settleResults({from: accounts[0]});
            electionInstance.getWinner('Bukit Timah', {from: accounts[0]});// placeholder region name
        }
        
        await truffleAssert.reverts(
            getWinner1,
            undefined,
            'Election not yet ended'
        );
        
        await truffleAssert.reverts(
            getWinner2,
            undefined,
            'Results not yet settled'
        );
        
        await truffleAssert.reverts(
            getWinner3,
            undefined,
            'Invalid region name'
        );

        assert.notStrictEqual(
            getWinner4,
            undefined,
            "Failed to get winner"
        );

    });

});