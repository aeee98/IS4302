/*
unit testing assumptions:
    1. accounts[1] will be admin, used for cases that should pass
    2. accounts[2] is not admin
    3. any account other than accoutns[1] should be used for cases the should fail
    4. tests are run before start date of all elections
*/

const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
const time = require('openzeppelin-test-helpers');
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

    it('Add voters', async() => {

        let _nriclist1 = ['S1234567A', 'S1234567B', 'S1234567C', 'S1234567D', 'S1234567E']
        let _nriclist2 = ['S1234567F', 'S1234567G', 'S1234567H', 'S1234567I', 'S1234567J']
        let _passwordlist1 = ['passwordA', 'passwordB', 'passwordC', 'passwordD', 'passwordE']
        let _passwordlist2 = ['passwordF', 'passwordG', 'passwordH', 'passwordI', 'passwordJ']

        let addVoters1 = async() => {
            electionInstance.addVoters(_nriclist1, _passwordlist1, 1, {from: accounts[0]})
            electionInstance.addVoters(_nriclist2, _passwordlist2, 2, {from: accounts[0]})
        }
        // empty NRIC list
        let addVoters2 = await electionInstance.addVoters([], _passwordlist1, 1, {from:accounts[0]})
        // empty password list
        let addVoters3 = await electionInstance.addVoters(_nriclist1, [], 1, {from: accounts[0]})

        assert.notStrictEqual(
            addVoters1,
            undefined,
            "Failed to add voters"
        )

        await truffleAssert.reverts(
            addVoters2,
            undefined,
            'No NRICs were added'
        )

        await truffleAssert.reverts(
            addVoters3,
            undefined,
            'Password list not same length as NRIC list'
        )

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
        // vote cannot be cast after election ended
        let vote5 = async() => {
            time.increaseTo(electionInstance.getEndDate())
            electionInstance.endElection({from: accounts[1]})
            electionInstance.vote(electionInstance.getVoteCodes[0], 10, {from: accounts[2]})
        }

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

        await truffleAssert.reverts(
            vote5,
            undefined,
            'Election has already ended, vote cannot be cast'
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
        
        // start date not yet reached
        let startElection1 = await electionInstance.startElection({from: accounts[1]})
        // election started
        let startElection2 = async() => {
            time.increaseTo(electionInstance.getStartDate({from: accounts[1]})) // set any timestamp in here
            electionInstance.startElection({from: accounts[1]})
        }
        // election already started
        let startElection3 = await electionInstance.startElection({from: accounts[1]})

        await truffleAssert.reverts(
            startElection1,
            undefined,
            'Start date not yet reached'
        )
        
        assert.notStrictEqual(
            startElection2,
            undefined,
            "Failed to start election"
        )

        await truffleAssert.reverts(
            startElection1,
            undefined,
            'Election already started'
        )

    })

    it('End election', async() => {

        // end date not yet reached
        let endElection1 = await electionInstance.endElection({from: accounts[1]})
        // election ended
        let endElection2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[1]}))
            electionInstance.endElection({from: accounts[1]})
        } 
        // election already ended
        let endElection3 = await electionInstance.endElection({from: accounts[1]})

        await truffleAssert.reverts(
            endElection1,
            undefined,
            'End date not yet reached'
        )
        
        assert.notStrictEqual(
            endElection2,
            undefined,
            "Failed to end election"
        )

        await truffleAssert.reverts(
            endElection3,
            undefined,
            'Election already ended'
        )

    })

    it('Settle results', async() => {

        // election not yet ended
        let settleResults1 = await electionInstance.settleResults({from: accounts[1]})
        // settle results
        let settleResults2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[1]}))
            electionInstance.endElection({from: accounts[1]})
            electionInstance.settleResults({from: accounts[1]})
        }
        // results already settled
        let settleResults3 = await electionInstance.settleResults({from: accounts[1]})


        await truffleAssert.reverts(
            settleResults1,
            undefined,
            'Election not yet ended'
        )

        assert.notStrictEqual(
            settleResults2,
            undefined,
            "Failed to settle results"
        )

        await truffleAssert.reverts(
            settleResults3,
            undefined,
            'Results already settled'
        )

    })

    it('Get winner', async() => {

        // election not yet ened
        let getWinner1 = await electionInstance.getWinner({from: accounts[1]})
        // results not yet settled, valid region
        let getWinner2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[1]}))
            electionInstance.endElection({from: accounts[1]})
            electionInstance.getWinner('Bukit Timah', {from: accounts[1]}) // placeholder region name
        }
        // results settled, invalid region
        let getWinner3 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[1]}))
            electionInstance.endElection({from: accounts[1]})
            electionInstance.settleResults({from: accounts[1]})
            electionInstance.getWinner('Woodlands', {from: accounts[1]}) // placeholder region name
        }
        // get winner
        let getWinner4 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[1]}))
            electionInstance.endElection({from: accounts[1]})
            electionInstance.settleResults({from: accounts[1]})
            electionInstance.getWinner('Bukit Timah', {from: accounts[1]}) // placeholder region name
        }
        
        await truffleAssert.reverts(
            getWinner1,
            undefined,
            'Election not yet ended'
        )
        
        await truffleAssert.reverts(
            getWinner2,
            undefined,
            'Results not yet settled'
        )
        
        await truffleAssert.reverts(
            getWinner3,
            undefined,
            'Invalid region name'
        )

        assert.notStrictEqual(
            getWinner4,
            undefined,
            "Failed to get winner"
        )

    })

}
)