const _deploy_contracts = require("../migrations/2_deploy_contracts.js");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');
const { syncBuiltinESMExports } = require("module");
const {BN, time} = require('@openzeppelin/test-helpers'); // pip install --save-dev @openzeppelin/test-helpers

var ElectionPortal = artifacts.require("../contracts/ElectionPortal.sol");
var ElectionAdministrator = artifacts.require("../contracts/ElectionAdministrator.sol");
var Election = artifacts.require("../contracts/Election.sol");


/* Election Administrator Tests */
contract("ElectionAdministrator", function(accounts) {
    before(async () => {
        ElectionAdministratorInstance = await ElectionAdministrator.deployed();
    });

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

/* Election.js tests */
contract('Election', function(accounts) {

    before(async () => {
        electionAdminInstance = await ElectionAdministrator.deployed();
        electionInstance = await Election.deployed();
        electionPortalInstance = await ElectionPortal.deployed();
    });

    let addRegion1, addRegion2;

    it('Add Region', async () => {
        
        addRegion1 = await electionInstance.addRegion("Bukit Timah", "vote", {from: accounts[0]});

        assert.notStrictEqual(
            addRegion1,
            undefined,
            "Failed to add region"
        );

        addRegion2 = await electionInstance.addRegion("Woodlands", "vote", {from: accounts[0]});

        assert.notStrictEqual(
            addRegion2,
            undefined,
            "Failed to add region"
        );
    });

    it('Add Candidate', async () => {
        let addCandidate1 = await electionInstance.addCandidate("People's Action Party", 1, "PAP", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add candidate"
        );

        let addCandidate2 = await electionInstance.addCandidate("Worker's Party", 1, "WP", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add candidate"
        );

        let regionCheck1 = await electionInstance.getRegion(1, {from:accounts[5]});

        assert.equal(regionCheck1.candidatesList.length, 2, "Error, wrong candidate count");

        let addCandidate3 = await electionInstance.addCandidate("Tan Ah Beng", 2, "TAB", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate3,
            undefined,
            "Failed to add candidate"
        );

        let addCandidate4 = await electionInstance.addCandidate("Lee An Teh", 2, "LAT", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate4,
            undefined,
            "Failed to add candidate"
        );

        let addCandidate5 = await electionInstance.addCandidate("See Ta", 2, "LAT", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate5,
            undefined,
            "Failed to add candidate"
        );

        let regionCheck2 = await electionInstance.getRegion(2, {from:accounts[5]});
        assert.equal(regionCheck2.candidatesList.length, 3, "Error, wrong candidate count");
    });

    it('Add voters', async() => {
        let _nriclist1 = ['S1234567A', 'S1234567B', 'S1234567C', 'S1234567D', 'S1234567E'];
        let _nriclist2 = ['S1234567F', 'S1234567G', 'S1234567H', 'S1234567I', 'S1234567J'];
        let _passwordlist1 = ['passwordA', 'passwordB', 'passwordC', 'passwordD', 'passwordE'];
        let _passwordlist2 = ['passwordF', 'passwordG', 'passwordH', 'passwordI', 'passwordJ'];

        let addVoters1 = await electionInstance.addVoters(_nriclist1, _passwordlist1, 1, {from: accounts[0]});
        let addVoters2 = await electionInstance.addVoters(_nriclist2, _passwordlist2, 2, {from: accounts[0]});

        truffleAssert.eventEmitted(addVoters1, 'VotersAddedInRegion', (ev) => {
            return ev.regionId == 1 && ev.count == 5;
        });
        truffleAssert.eventEmitted(addVoters2, 'VotersAddedInRegion', (ev) => {
            return ev.regionId == 2 && ev.count == 5;
        });

        await truffleAssert.reverts(
            electionInstance.addVoters(['1'], _passwordlist1, 1, {from:accounts[0]}),
            'Both lists must be the same length'
        );

        await truffleAssert.reverts(
             electionInstance.addVoters(_nriclist1, ['1'], 1, {from: accounts[0]}),
            'Both lists must be the same length'
        );
    });

    // adminOnly modifier is tested here and will not be tested in subsequent unit tests
    it('Change start date', async() => {

        let changeStartDate1 = await electionInstance.changeStartDate(new BN(Date.now()).add(new BN(180000)), {from: accounts[0]});

        assert.notStrictEqual(
            changeStartDate1,
            undefined,
            "Failed to change start date"
        );

        await truffleAssert.reverts(
            electionInstance.changeStartDate(0, {from: accounts[0]}),
            'Error, Start Date has passed'
        );

    });

    it('Change end date', async() => {

        let changeEndDate1 = await electionInstance.changeEndDate(new BN(await electionInstance.getStartDate({from: accounts[0]})).add(new BN(1800000)), {from: accounts[0]});

        assert.notStrictEqual(
            changeEndDate1,
            undefined,
            "Failed to change end date"
        );

        await truffleAssert.reverts(
            electionInstance.changeEndDate(new BN(await electionInstance.getStartDate({from: accounts[0]})).sub(new BN(2000)), {from: accounts[0]}),
            'Error, End Date cannot be before Start Date'
        );
    });

    it('Start election', async() => {

        await truffleAssert.reverts(
            electionInstance.startElection({from: accounts[0]}),
            'Can only start after start date'
        );
        
        time.increaseTo(await electionInstance.getStartDate({from: accounts[0]}));
        // election started
        let startElection2 = electionInstance.startElection({from: accounts[0]});
        
        assert.notStrictEqual(
            startElection2,
            undefined,
            "Failed to start election"
        );

        truffleAssert.reverts(
            electionInstance.startElection({from: accounts[0]}),
            'Error, cannot start election that has already started'
        );

        truffleAssert.reverts(
            electionInstance.changeStartDate(100, {from: accounts[0]}),
            'Error, election has started'
        );

        truffleAssert.reverts(
            electionInstance.changeEndDate(100, {from: accounts[0]}),
            'Error, election has started'
        );

    });

    it('Vote', async () => {

        await truffleAssert.reverts(
            electionInstance.vote('S1234567B', 'passwordB', 10, {from: accounts[0]}),
            'Error, invalid candidateId'
        );

        await truffleAssert.reverts(
            electionInstance.vote('S1234567A', 'passwordB', 1, {from: accounts[0]}),
            'Error, authentication failure'
        );

        let vote1 = await electionInstance.vote('S1234567A', 'passwordA', 1, {from: accounts[0]});
        let vote2 = await electionInstance.vote('S1234567B', 'passwordB', 1, {from: accounts[0]});
        let vote3 = await electionInstance.vote('S1234567C', 'passwordC', 1, {from: accounts[0]});
        let vote4 = await electionInstance.vote('S1234567D', 'passwordD', 1, {from: accounts[0]});
        let vote5 = await electionInstance.vote('S1234567E', 'passwordE', 2, {from: accounts[0]});
        let vote6 = await electionInstance.vote('S1234567F', 'passwordF', 3, {from: accounts[0]});
        let vote7 = await electionInstance.vote('S1234567G', 'passwordG', 3, {from: accounts[0]});
        let vote8 = await electionInstance.vote('S1234567H', 'passwordH', 3, {from: accounts[0]});
        let vote9 = await electionInstance.vote('S1234567I', 'passwordI', 4, {from: accounts[0]});
        let vote10 = await electionInstance.vote('S1234567J', 'passwordJ', 5, {from: accounts[0]});
        
        truffleAssert.eventEmitted(vote1, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote2, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote3, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote4, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote5, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote6, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote7, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote8, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote9, 'VoteSucceeded');
        truffleAssert.eventEmitted(vote10, 'VoteSucceeded');

        await truffleAssert.reverts(
            electionInstance.vote('S1234567A', 'passwordA', 1, {from: accounts[0]}),
            'Has already voted'
        );

        await truffleAssert.reverts(
            electionInstance.getWinner({from: accounts[0]}),
            'Error, election has not ended yet'
        );

        await truffleAssert.reverts(
            electionInstance.settleResults({from: accounts[0]}),
            'Result not available yet'
        );

    });

    it('End election', async() => {
        await truffleAssert.reverts(
            electionInstance.endElection({from: accounts[0]}),
            'Error, ensure to only end after end time'
        );

        time.increaseTo(await electionInstance.getEndDate({from: accounts[0]}))
        // election ended
        let endElection2 = electionInstance.endElection({from: accounts[0]})

       
        assert.notStrictEqual(
            endElection2,
            undefined,
            "Failed to end election"
        );

        await truffleAssert.reverts(
            electionInstance.endElection({from: accounts[0]}),
            'Error, election has already ended'
        );

        await truffleAssert.reverts(
            electionInstance.vote('S1234567B', 'passwordB', 1, {from: accounts[0]}),
            'Error, not available for voting'
        );
    });

    it('Settle results', async() => {

        truffleAssert.reverts(
            electionInstance.getWinner('Bukit Timah', {from: accounts[0]}), // placeholder region name
            'Results not set up yet'
        );

        let settleResults2 = await electionInstance.settleResults({from: accounts[0]});

        assert.notStrictEqual(
            settleResults2,
            undefined,
            "Failed to settle results"
        );

        truffleAssert.reverts(
            electionInstance.settleResults({from: accounts[0]}),
            'Results already settled'
        );

    });

    it('Get winner', async() => {
        let getWinner2 = await electionInstance.getWinner('Bukit Timah', {from: accounts[0]}) // placeholder region name
        //console.log(getWinner2);
        truffleAssert.eventEmitted(getWinner2, "Winner", (ev) => { return ev.winner == "People's Action Party";}, "Invalid Region 1 Winner");
        let getWinner3 = await electionInstance.getWinner('Woodlands', {from: accounts[0]}) // placeholder region name
        //console.log(getWinner3);
        truffleAssert.eventEmitted(getWinner3, "Winner", (ev) => { return ev.winner == "Tan Ah Beng"; }, "Invalid Region 2 Winner");
    });

});