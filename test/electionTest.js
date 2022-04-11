/*
unit testing assumptions:
    1. accounts[1] will be admin, used for cases that should pass
    2. accounts[2] is not admin
    3. any account other than accoutns[1] should be used for cases the should fail
*/

const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');
const { start } = require("repl");


var electionInstance = artifacts.require("../contracts/Election.sol");

contract('Election', function(accounts) {

    before(async () => {
        Election = await Election.deployed();
    });
    console.log("Testing Election Contract");

    it('Add Candidate', async () => {
        let addCandidate1 = await electionInstance.addCandidate("John", 1, "vote", {from: accounts[1]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add candidate"
        );

    })

    it('Add Region', async () => {
        
        let addRegion1 = await electionInstance.addRegion("Bukit Timah", "vote", {from: accounts[1]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add region"
        );

    })

    // WIP
    it('Authenticate Voter', async () => {

        let authenticateVoter1 = await electionInstance.authenticateVoter("S12345678A", "password", {from: accounts[1]})

    });

    it('Vote', async () => {
        
        // test normal vote
        let vote1 = await electionInstance.vote(electionInstance.getVoteCodes[0], 1, {from: accounts[1]})
        // test vote with invalid voteCode
        let vote2 = async () => {
            electionInstance.setVoteCodes(electionInstance.getVoteCodes().push(0));
            electionInstance.vote(electionInstance.getVoteCodes[1], 1, {from: accounts[2]});
        }
        // test vote when already voted
        let vote3 = await electionInstance.vote(electionInstance.getVoteCodes[0], 1, {from: accounts[1]})
        // test vote for invalid candidate
        let vote4 = await electionInstance.vote(electionInstance.getVoteCodes[0], 10, {from: accounts[2]})

        assert.notStrictEqual(
            vote1,
            undefined,
            "Failed to cast vote"
        )

        await truffleAssert.reverts(
            vote2,
            undefined,
            'Invalid voteCode'
        )

        await truffleAssert.reverts(
            vote3,
            undefined,
            'Account has already voted'
        )

        await truffleAssert.reverts(
            vote4,
            undefined,
            'Invalid candidateId'
        )

    });

    // adminOnly modifier is tested here and will not be tested in subsequent unit tests
    it('Change start date', async() => {

        let changeStartDate1 = await electionInstance.changeStartDate(100, {from: accounts[1]})
        // accounts[2] is not admin
        let changeStartDate2 = await electionInstance.changeStartDate(100, {from: accounts[2]})
        // start date passed
        let changeStartDate3 = await electionInstance.changeStartDate(0, {from: accounts[1]})

        assert.notStrictEqual(
            changeStartDate1,
            undefined,
            "Failed to change start date"
        )

        await truffleAssert.reverts(
            changeStartDate2,
            undefined,
            'Not admin account'
        )

        await truffleAssert.reverts(
            changeStartDate3,
            undefined,
            'New start date has already passed'
        )

    })

    it('Change end date', async() => {

        let changeEndDate1 = await electionInstance.changeEndDate(200, {from: accounts[1]})
        // end date before start date
        let changeEndDate2 = await electionInstance.changeEndDate(20, {from: accounts[1]})

        assert.notStrictEqual(
            changeEndDate1,
            undefined,
            "Failed to change end date"
        )

        await truffleAssert.reverts(
            changeEndDate2,
            undefined,
            'New end date cannot be before start date'
        )
    })

    it('Start election', async() => {

        let startElection1 = await electionInstance.startElection({from: accounts[1]})
        // election already started
        let startElection2 = await electionInstance.startElection({from: accounts[1]})
        // start date not yet reached

        assert.notStrictEqual(
            startElection1,
            undefined,
            "Failed to start election"
        )

        await truffleAssert.reverts(
            startElection2,
            undefined,
            'Election already started'
        )

    })

    it('End election', async() => {

        let endElection1 = await electionInstance.endElection({from: accounts[1]})
        // election already ended
        let endElection2 = await electionInstance.endElection({from: accounts[1]})
        // end date not yet passed

        assert.notStrictEqual(
            endElection1,
            undefined,
            "Failed to end election"
        )

        await truffleAssert.reverts(
            endElection2,
            undefined,
            'Election already staendedrted'
        )

    })

}
)