const _deploy_contracts = require("../migrations/2_deploy_contracts.js");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');
const { syncBuiltinESMExports } = require("module");


var ElectionPortal = artifacts.require("../contracts/ElectionPortal.sol");
var ElectionAdministrator = artifacts.require("../contracts/ElectionAdministrator.sol");
var Election = artifacts.require("../contracts/Election.sol");

contract('ElectionPortal', function(accounts) {
    before(async () => {
        electionAdminInstance = await ElectionAdministrator.deployed();
        electionInstance = await Election.deployed();
        electionPortalInstance = await ElectionPortal.deployed();
    });

    it('Test Must Have Election', async() => {
        await truffleAssert.reverts(electionPortalInstance.getLatestElection(), "Please add an election first!");
    });

    it('Test Add Election', async() => {
        let addElection = await electionPortalInstance.addNewElection(electionInstance.address);
        truffleAssert.eventEmitted(addElection, "ElectionAdded");
    });

    it('Test Can View Election', async() => {
        let lastestElection = await electionPortalInstance.getLatestElection();
        assert.equal(lastestElection, electionInstance.address);
    });

    // source for sleep code: https://blog.devgenius.io/how-to-make-javascript-sleep-or-wait-d95d33c99909
    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
    it('Test Cannot View Election After End', async() => {
        await sleep(3*1000);
        await electionInstance.startElection();
        await sleep(1*1000);
        await electionInstance.endElection();
        await truffleAssert.reverts(electionPortalInstance.getLatestElection(), "Election has ended.");
    });

    
});