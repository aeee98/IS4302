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