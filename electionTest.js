/*
unit testing assumptions:
    1. accounts[0] will be admin, used for cases that should pass
    2. accounts[2] is not admin
    3. any account other than accoutns[1] should be used for cases the should fail
    4. tests are run before start date of all elections
*/

const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
const time = require('@openzeppelin/test-helpers'); // pip install --save-dev @openzeppelin/test-helpers

var assert = require('assert');
const { start } = require("repl");


var electionInstance = artifacts.require("../contracts/Election.sol");

contract('Election', function(accounts) {

    before(async () => {
        Election = await Election.deployed();
    });
    console.log("Testing Election Contract");

    it('Add Candidate', async () => {
        let addCandidate1 = await electionInstance.addCandidate("John", 1, "vote", {from: accounts[0]});

        assert.notStrictEqual(
            addCandidate1,
            undefined,
            "Failed to add candidate"
        );

    })

    it('Add Region', async () => {
        
        let addRegion1 = await electionInstance.addRegion("Bukit Timah", "vote", {from: accounts[0]});

        assert.notStrictEqual(
            addRegion1,
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

        assert.notStrictEqual(
            addVoters1,
            undefined,
            "Failed to add voters"
        )

        await truffleAssert.reverts(
            electionInstance.addVoters([], _passwordlist1, 1, {from:accounts[0]}),
            'No NRICs were added'
        )

        await truffleAssert.reverts(
            electionInstance.addVoters(_nriclist1, [], 1, {from: accounts[0]}),
            'Password list not same length as NRIC list'
        )

    })

    // WIP
    it('Authenticate Voter', async () => {

        let authenticateVoter1 = await electionInstance.authenticateVoter("S12345678A", "password", {from: accounts[0]});

    });

    it('Vote', async () => {
        
        // test normal vote
        let vote1 = await electionInstance.vote(electionInstance.getVoteCodes[0], 1, {from: accounts[0]})

        assert.notStrictEqual(
            vote1,
            undefined,
            "Failed to cast vote"
        );

        await truffleAssert.reverts(
            async () => {
                electionInstance.setVoteCodes(electionInstance.getVoteCodes().push(0));
                electionInstance.vote(electionInstance.getVoteCodes[1], 1, {from: accounts[2]});
            },
            'Error, voteCode is not valid'
        )

        await truffleAssert.reverts(
            electionInstance.vote(electionInstance.getVoteCodes[0], 1, {from: accounts[0]}),
            'Error, vote has already been cast'
        )

        await truffleAssert.reverts(
            electionInstance.vote(electionInstance.getVoteCodes[0], 10, {from: accounts[2]}),
            'Error, invalid candidateId'
        )

        await truffleAssert.reverts(
            async() => {
                time.increaseTo(electionInstance.getEndDate())
                electionInstance.endElection({from: accounts[0]})
                electionInstance.vote(electionInstance.getVoteCodes[0], 10, {from: accounts[2]})
            },
            'Error, not available for voting'
        )

    });

    // adminOnly modifier is tested here and will not be tested in subsequent unit tests
    it('Change start date', async() => {

        let changeStartDate1 = await electionInstance.changeStartDate(100, {from: accounts[0]})

        assert.notStrictEqual(
            changeStartDate1,
            undefined,
            "Failed to change start date"
        );

        await truffleAssert.reverts(
            electionInstance.changeStartDate(100, {from: accounts[0]}),
            'Error, election has started'
        )

        await truffleAssert.reverts(
            electionInstance.changeStartDate(electionInstance.getStartDate({from: accounts[0]}) - 1, {from: accounts[0]}),
            'Error, Start Date has passed'
        )

    });

    it('Change end date', async() => {

        let changeEndDate1 = await electionInstance.changeEndDate(electionInstance.getEndDate({from: accounts[0]}) + 100, {from: accounts[0]})

        assert.notStrictEqual(
            changeEndDate1,
            undefined,
            "Failed to change end date"
        );

        await truffleAssert.reverts(
            async() => {
                electionInstance.startElection({from: accounts[0]})
                electionInstance.changeEndDate(electionInstance.getEndDate({from: accounts[0]}) + 100, {from: accounts[0]})
            },
            'Error, End Date cannot be before Start Date'
        )

        await truffleAssert.reverts(
            electionInstance.changeEndDate(electionInstance.getStartDate({from: accounts[0]}) - 100, {from: accounts[0]}),
            'Error, End Date cannot be before Start Date'
        )
    })

    it('Start election', async() => {
        
        // election started
        let startElection2 = async() => {
            time.increaseTo(electionInstance.getStartDate({from: accounts[0]})) // set any timestamp in here
            electionInstance.startElection({from: accounts[0]})
        }

        await truffleAssert.reverts(
            electionInstance.startElection({from: accounts[0]}),
            'Can only start after start date'
        )
        
        assert.notStrictEqual(
            startElection2,
            undefined,
            "Failed to start election"
        );

        await truffleAssert.reverts(
            electionInstance.startElection({from: accounts[0]}),
            'Error, cannot start election that has already started'
        )

    });

    it('End election', async() => {

        // election ended
        let endElection2 = async() => {
            time.increaseTo(electionInstance.getEndDate({from: accounts[0]}))
            electionInstance.endElection({from: accounts[0]})
        } 

        await truffleAssert.reverts(
            electionInstance.endElection({from: accounts[0]}),
            'Error, ensure to only end after end time'
        )
        ;
        assert.notStrictEqual(
            endElection2,
            undefined,
            "Failed to end election"
        );

        await truffleAssert.reverts(
            electionInstance.endElection({from: accounts[0]}),
            'Error, election has already ended'
        )

    });

    it('Settle results', async() => {

        // election not yet ended
        let settleResults1 = await electionInstance.settleResults({from: accounts[0]})
        // settle results
        let settleResults2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}))
            electionInstance.endElection({from: accounts[0]})
            electionInstance.settleResults({from: accounts[0]})
        }
        // results already settled
        let settleResults3 = await electionInstance.settleResults({from: accounts[0]})


        await truffleAssert.reverts(
            electionInstance.settleResults({from: accounts[0]}),
            'Result not available yet'
        )

        assert.notStrictEqual(
            settleResults2,
            undefined,
            "Failed to settle results"
        );

        await truffleAssert.reverts(
            electionInstance.settleResults({from: accounts[0]}),
            'Results already settled'
        );

    });

    it('Get winner', async() => {

        // election not yet ened
        let getWinner1 = await electionInstance.getWinner({from: accounts[0]})
        // results not yet settled, valid region
        let getWinner2 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}))
            electionInstance.endElection({from: accounts[0]})
            electionInstance.getWinner('Bukit Timah', {from: accounts[0]}) // placeholder region name
        }
        // results settled, invalid region
        let getWinner3 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}))
            electionInstance.endElection({from: accounts[0]})
            electionInstance.settleResults({from: accounts[0]})
            electionInstance.getWinner('Woodlands', {from: accounts[0]}) // placeholder region name
        }
        // get winner
        let getWinner4 = async() => {
            time.increasTo(electionInstance.getEndDate({from: accounts[0]}))
            electionInstance.endElection({from: accounts[0]})
            electionInstance.settleResults({from: accounts[0]})
            electionInstance.getWinner('Bukit Timah', {from: accounts[0]}) // placeholder region name
        }
        
        await truffleAssert.reverts(
            electionInstance.getWinner({from: accounts[0]}),
            'Error, election has not ended yet'
        )
        
        await truffleAssert.reverts(
            async() => {
                time.increasTo(electionInstance.getEndDate({from: accounts[0]}))
                electionInstance.endElection({from: accounts[0]})
                electionInstance.getWinner('Bukit Timah', {from: accounts[0]}) // placeholder region name
            },
            'Results not set up yet'
        )
        
        await truffleAssert.reverts(
            async() => {
                time.increasTo(electionInstance.getEndDate({from: accounts[0]}))
                electionInstance.endElection({from: accounts[0]})
                electionInstance.settleResults({from: accounts[0]})
                electionInstance.getWinner('Woodlands', {from: accounts[0]}) // placeholder region name
            },
            'Region Name does not exist'
        )

        assert.notStrictEqual(
            getWinner4,
            undefined,
            "Failed to get winner"
        );

    });

});