// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ElectionAdministrator.sol";

contract Election {

    ElectionAdministrator private administratorContract;

    string private electionTitle;
    uint256 private startDate;
    uint256 private endDate;
    bool private hasStarted; //This is used to double confirm that the election has actually started
    bool private hasEnded; //This is used to confirm that the election has actually ended
    uint32 private candidatesCount;
    uint32 private regionsCount;

    // change type to uint256, to store voteCode (type: uint256)
    uint256[] private voteCodes;

    struct Candidate {  
        uint256 id;
        string name;
        uint256 grcId;
        string electionTitle;
        bool valid;
    }

    struct Region {
        uint256 regionId;
        string name;
        uint256 voteCount;
        uint256[] candidatesList;
        string electionTitle;
        bool valid;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => Region) public regions;
    mapping(bytes32 => bytes32) private voters; //Hashed nric to hashed password
    mapping(bytes32 => bool) private hasRegisteredVote; //Hashed nric to true/false value, by default it is false.
    mapping(bytes32 => uint256) private voterRegions; //Hashed nric to Region
    mapping(uint256 => uint256) private voteValidity; //voteCode to Region 
    mapping(uint256 => bytes32) private votes; //voteCode to Candidate. Votes are still needed for verification purposes even with counts accounted for, probably only by admins.
    mapping(bytes32 => mapping(bytes32 => uint32)) private votecounts; // Region => Candidate -> votes 

    string[][] private results;


    event VoteSucceeded();

    event ElectionWinner(string region, string candidate, uint256 votes);

    //TODO: Handle Voting Process

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    modifier hasNotStarted {
        require(hasStarted == false);
        _;
    }

    modifier alreadyStarted {
        require(hasStarted == true);
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

    function addCandidate(string memory _name, uint256 _regionId, string memory _electionTitle) public adminOnly hasNotStarted {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _regionId, _electionTitle, true);
        regions[_regionId].candidatesList.push(candidatesCount);
    }

    function addRegion(string memory _name, string memory _electionTitle) public adminOnly hasNotStarted {
        uint256[] memory candidatesList;
        regionsCount++;
        regions[regionsCount] = Region(regionsCount, _name, 0, candidatesList, _electionTitle, true);
    }

    /*
     * @dev Authenticates the voter, generates the vote code and gives it to user. 
     */
    function authenticateVoter(string memory _nric, string memory _password) public returns (uint256) {
        require(voters[keccak256(abi.encodePacked(_nric))] == keccak256(abi.encodePacked(_password)), "Error, authentication failure");
        require(hasRegisteredVote[keccak256(abi.encodePacked(_nric))] == false, "Has already voted");
        uint256 regionid = voterRegions[keccak256(abi.encodePacked(_nric))];
        Region memory voterRegion = regions[regionid];

        require(voterRegion.valid, "Invalid Region");
        uint256 voteCode = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _nric)));

        // add voteCode to voteCodes[] for testing
        voteCodes.push(voteCode);

        hasRegisteredVote[keccak256(abi.encodePacked(_nric))] = true;
        voteValidity[voteCode] = regionid;
        return voteCode;
    }

    function vote(uint256 _voteCode, uint256 _candidateId) public {
        require(voteValidity[_voteCode] > 0, "Error, voteCode is not valid");
        require(hasStarted == true && hasEnded == false, "Error, not available for voting");
        require(votes[_voteCode] == bytes32(0), "Error, vote has already been cast");

        uint256[] memory voterRegionCandidates = regions[voteValidity[_voteCode]].candidatesList;
        bool found = false;
        for (uint i=0; i<voterRegionCandidates.length; i++) {
            if(voterRegionCandidates[i] == _candidateId) {
                found = true;
                break;
            }
        }
        require(found == true, "Error, invalid candidateId");

        votes[_voteCode] = keccak256(abi.encodePacked(_candidateId)); //Encrypt candidate id only

        emit VoteSucceeded();
        //voteCodes.(_voteCode); //Voted
        //add vote to count.

        votecounts[keccak256(abi.encode(voteValidity[_voteCode]))][keccak256(abi.encodePacked(_candidateId))] += 1;
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

    //Gets winner of election.
    function settleResults() public adminOnly returns (string[][] memory) {
        require(hasEnded == true, "Result not available yet");
        require(results.length == 0, "Results already settled");

        for (uint i = 0; i < regionsCount; i++) {
            //Handle Results on a per region basis.
            
            
        }

        return results;
    }

    function getWinner(string memory _grcCode) public view returns (string memory) {
        require(hasEnded, "has not ended yet");
        require(results.length > 0, "Results not set up yet");


        return "lol"; //TODO: Ignore this
    }

    function getRegion(uint256 id) public view returns (Region memory) {
        return regions[id];
    }

    function getVoteCodes() public view returns (uint256[] memory) {
        return voteCodes;
    }

    // to use in testing
    function setVoteCodes(uint256[] memory _voteCodes) public {
        voteCodes = _voteCodes;
    }
}