// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ElectionAdministrator.sol";
import "./util/StringUtils.sol";

contract Election {

    ElectionAdministrator private administratorContract;

    string private electionTitle;
    uint256 private startDate;
    uint256 private endDate;
    bool private hasStarted; //This is used to double confirm that the election has actually started
    bool private hasEnded; //This is used to confirm that the election has actually ended
    uint16 private candidatesCount;
    uint16 private regionsCount;
    string[] private voteCodes;
    string[][] private results;
    bool private exists;

    struct Candidate {  
        uint16 id;
        string name;
        uint16 regionId;
        string electionTitle;
        bool valid;
    }

    struct Region {
        uint16 regionId;
        string name;
        uint16[] candidatesList;
        string electionTitle;
        bool valid;
    }

    mapping(address => bool) private allowedsystems; //Assume only polling stations are allowed, this will be the only systems that are allowed to access
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => Region) public regions;
    mapping(bytes32 => bytes32) private voters; //Hashed nric to hashed password
    mapping(bytes32 => bool) private hasRegisteredVote; //Hashed nric to true/false value, by default it is false
    mapping(bytes32 => uint16) private voterRegions; //Hashed nric to regionId
    mapping(uint256 => uint16) private voteValidity; //voteCode to regionId
    mapping(uint256 => bytes32) private votes; //voteCode to hashed candidateId. Votes are still needed for verification purposes even with counts accounted for, probably only by admins.
    mapping(bytes32 => uint32) private votecounts; // Candidate -> votes 

    event VoteSucceeded();
    event ElectionWinner(string region, string candidate, uint32 votes);

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

    modifier isAllowedSystem {
        require(allowedsystems[msg.sender] == true, "Not allowed system");
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
        exists = true;
    }

    function addSystem(address pollsystem) public adminOnly hasNotStarted {
        allowedsystems[pollsystem] = true;
    }

    function removeSystem(address pollsystem) public adminOnly hasNotStarted {
        allowedsystems[pollsystem] = false;
    }

    function addCandidate(string memory _name, uint16 _regionId, string memory _electionTitle) public adminOnly hasNotStarted {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _regionId, _electionTitle, true);
        regions[_regionId].candidatesList.push(candidatesCount);
    }

    function addRegion(string memory _name, string memory _electionTitle) public adminOnly hasNotStarted {
        uint16[] memory candidatesList;
        regionsCount++;
        regions[regionsCount] = Region(regionsCount, _name, candidatesList, _electionTitle, true);
    }

    /*
     * @dev Authenticates the voter, generates the vote code and gives it to user. 
     */
    function authenticateVoter(string memory _nric, string memory _password) public returns (uint256) {
        require(voters[keccak256(abi.encodePacked(_nric))] == keccak256(abi.encodePacked(_password)), "Error, authentication failure");
        require(hasRegisteredVote[keccak256(abi.encodePacked(_nric))] == false, "Has already voted");
        uint16 regionid = voterRegions[keccak256(abi.encodePacked(_nric))];
        Region memory voterRegion = regions[regionid];

        require(voterRegion.valid, "Invalid Region");
        uint256 voteCode = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _nric)));

        // add voteCode to voteCodes[] for testing
        // voteCodes.push(voteCode);

        hasRegisteredVote[keccak256(abi.encodePacked(_nric))] = true;
        voteValidity[voteCode] = regionid;
        return voteCode;
    }

    function vote(uint256 _voteCode, uint16 _candidateId) public {
        require(voteValidity[_voteCode] > 0, "Error, voteCode is not valid");
        require(hasStarted == true && hasEnded == false, "Error, not available for voting");
        require(votes[_voteCode] == bytes32(0), "Error, vote has already been cast");

        uint16[] memory voterRegionCandidates = regions[voteValidity[_voteCode]].candidatesList;
        bool found = false;
        for (uint16 i=0; i<voterRegionCandidates.length; i++) {
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

        votecounts[keccak256(abi.encodePacked(_candidateId))] += 1;
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

    //Gets winner of election
    function settleResults() public adminOnly returns (string[][] memory) {
        require(hasEnded == true, "Result not available yet");
        require(results.length == 0, "Results already settled");

        for (uint16 i = 0; i < regionsCount; i++) {
            //Handle Results on a per region basis
            Region memory regionCheck = regions[i];
            uint maxCount = 0;
            uint winner = 0;

            for (uint16 j = 0; j < regionCheck.candidatesList.length; j++) {
                uint32 votecount =  votecounts[keccak256(abi.encodePacked(regionCheck.candidatesList[j]))];
                if (votecount > maxCount) {
                    maxCount = votecount;
                    winner = regionCheck.candidatesList[j];
                }
            }

            string[] memory added = new string[](2);
            added[0] = regionCheck.name;
            added[1] = candidates[winner].name;
            results.push(added);
        }

        return results;
    }

    function getWinner(string memory _regionname) public view returns (string memory) {
        require(hasEnded, "Error, election has not ended yet");
        require(results.length > 0, "Results not set up yet");
        for (uint16 i = 0; i < results.length; i++) {
            if (StringUtils.equal(_regionname, results[i][0])) {
                return (results[i][1]);
            }
        }
        revert("Region Name does not exist");
    }

    function getRegion(uint16 id) public view returns (Region memory) {
        return regions[id];
    }

    function getCandidate(uint16 id) public view returns (Candidate memory) {
        return candidates[id];
    }

    function checkExists() public view returns (bool) {
        return exists;
    }

/*
    function getVoteCodes() public view returns (uint256[] memory) {
        return voteCodes;
    }

    // to use in testing
    function setVoteCodes(uint256[] memory _voteCodes) public {
        voteCodes = _voteCodes;
    }
*/
}