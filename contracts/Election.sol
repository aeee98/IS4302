// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ElectionAdministrator.sol";

contract Election {

    ElectionAdministrator administratorContract;

    string electionTitle;
    uint256 startDate;
    uint256 endDate;
    bool hasStarted; //This is used to double confirm that the election has actually started
    bool hasEnded; //This is used to confirm that the election has actually ended
    unit256 candidatesCount;
    uint256 regionsCount;
    string[] voteCodes;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        uint256 grcId;
        string electionTitle;
    }

    struct Region {
        uint256 regionId;
        string name;
        uint256 voteCount;
        unint256[] candidatesList;
        string electionTitle;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => Region) public regions;
    mapping(bytes32 => bytes32) private voters; //Hashed nric to hashed password
    mapping(bytes32 => Region) private voterRegions; //Hashed nric to Region
    mapping(uint256 => Region) private voteValidity; //voteCode to Region 
    mapping(uint256 => Candidate) private votes; //voteCode to Candidate

    //TODO: Create the election blocks, the GRCs and stuff

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(string memory _electionTitle, uint256 _startDate, uint256 _endDate, ElectionAdministrator _administratorContract) {
        require(_startDate > block.timestamp, "Error, Start Date has passed.");
        require(_endDate > _startDate, "Error, End Date cannot be before start date.");
        require (bytes(_electionTitle).length > 0, "Error, must include election title");
        electionTitle = _electionTitle;
        startDate = _startDate;
        endDate = _endDate;
        hasStarted = false; 
        hasEnded = false;
        administratorContract = _administratorContract;
    }

    function addCandidate(string memory _name, uint256 _regionId, string memory _electionTitle) public {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0, _regionId, _electionTitle);
        Region[_regionId] = candidatesCount;
    }

    function addRegion(string memory _name, string memory _electionTitle) public {
        regionsCount++;
        regions[regionsCount] = Region(regionsCount, _name, 0, [], _electionTitle);
    }

    function authenticateVoter(string _nric, string _password) public returns (uint256) {
        require(voters[keccak256(_nric)] == keccak256(_password), "Error, authentication failure");
        
        Region voterRegion = voterRegions[keccak256(_nric)];
        unint256 voteCode = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _nric)));
        voteValidity[voteCode] = voterRegion;
        return voteCode;
    }

    function vote(uint256 _voteCode, uint256 _candidateId) public {
        require(voteValidity[_voteCode] != 0, "Error, voteCode is not valid");

        voterRegionCandidates = voteValidity[_voteCode].candidatesList;
        bool found = false;
        for (uint i=0; i<voterRegionCandidates.length; i++) {
            if(voterRegionCandidates[i] == _candidateId) {
                found = true;
                break;
            }
        }
        require(found == true, "Error, invalid candidateId");

        votes[_voteCode] = keccak256(_voteCode, _candidateId); //Encrypt vote
        voteCodes.push(_voteCode); //Voted
    }

    function getStartDate() public view returns (uint256) {
        return startDate;
    }

    function getEndDate() public view returns (uint256) {
        return endDate;
    }

    function checkStarted() public view returns (bool) {
        return hasStarted;
    }

    function checkEnded() public view returns (bool) {
        return hasEnded;
    }

    function changeStartDate(uint256 newStartDate) public adminOnly {
        require(hasStarted == false, "Error, election has started");
        require(newStartDate > block.timestamp, "Error, Start Date has passed");

        startDate = newStartDate;
    }

    function changeEndDate(uint256 newEndDate) public adminOnly {
        require(hasStarted == false, "Error, election has started");
        require(newEndDate > startDate, "Error, End Date cannot be before Start Date");

        endDate = newEndDate;
    }

    function startElection() public adminOnly {
        require(hasStarted == false, "Error, cannot start election that has already started");
        require(block.timestamp >= startDate, "Can only start after start date");

        hasStarted = true;
    }

    function endElection() public adminOnly {
        require(hasStarted == true, "Error, election has not started yet");
        require(hasEnded == false, "Error, election has already ended");
        require(block.timestamp >= endDate, "Error, ensure to only end after end time");

        hasEnded = true;
    }
}