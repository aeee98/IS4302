pragma solidity ^0.8.0;

import "./ElectionAdministrator.sol";

contract Election {

    ElectionAdministrator administratorContract;

    string public electionTitle;
    uint256 public startDate;
    uint256 public endDate;
    bool public hasStarted; //This is used to double confirm that the election has actually started
    bool public hasEnded; //This is used to confirm that the election has actually ended.

    //TODO: Create the election blocks, the GRCs and stuff

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(string memory _electionTitle, uint256 _startDate, uint256 _endDate, ElectionAdministrator _administratorContract) {
        require(_startDate > block.timestamp, "Error, Start Date has passed.");
        require(_endDate > _startDate, "Error, End Date cannot be before start date.");
        electionTitle = _electionTitle;
        _startDate = _startDate;
        _endDate = _endDate;
        hasStarted = false; 
        hasEnded = false;
        administratorContract = _administratorContract;
    }

    function changeStartDate (uint256 newStartDate) public adminOnly {
        require (hasStarted == false, "Error, election has started");
        require (newStartDate > block.timestamp, "Error, Start Date has passed");

        startDate = newStartDate;
    }

    function changeEndDate (uint256 newEndDate) public adminOnly {
        require (hasStarted == false, "Error, election has started");
        require (newEndDate > startDate, "Error, End Date cannot be before Start Date");

        endDate = newEndDate;
    }

    function startElection() public adminOnly {
        require (hasStarted == false, "Error, cannot start election that has already started");
        require (block.timestamp >= startDate, "Can only start after start date");

        hasStarted = true;
    }

    function endElection() public adminOnly {
        require (hasStarted == true, "Error, election has not started yet");
        require (hasEnded == false, "Error, election has already ended");
        require (block.timestamp >= endDate, "Error, ensure to only end after end time");

        hasEnded = true;
    }

}