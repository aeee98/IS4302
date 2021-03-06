// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ElectionAdministrator.sol";
import "./util/StringUtils.sol";

/** 
 * @dev The Election Contract contains the information of the particular election. This includes the ability to start and stop an election, 
 * voters and regions that are available and also the ability to vote for the candidates.
 * 
 * In the current implementation, self-destruction is not possible to prevent exploitation.
 */
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
        string candidateCodeName;
        bool valid;
    }

    struct Region {
        uint16 regionId;
        string name;
        uint16[] candidatesList;
        string regionTitle;
        bool valid;
    }

    mapping(address => bool) private allowedsystems; //Assume only polling stations are allowed, this will be the only systems that are allowed to access
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => Region) public regions;
    mapping(bytes32 => bytes32) private voters; //Hashed nric to hashed password
    mapping(bytes32 => bool) private hasRegisteredVote; //Hashed nric to true/false value, by default it is false
    mapping(bytes32 => uint16) private voterRegions; //Hashed nric to regionId
    mapping(bytes32 => bytes32) private votes; //voteCode to hashed candidateId. Votes are still needed for verification purposes even with counts accounted for, probably only by admins.
    mapping(bytes32 => uint256) private votecounts; // Candidate -> votes 

    event VotersAddedInRegion(uint16 regionId, uint256 count);
    event VoteSucceeded();
    event ElectionWinner(string region, string candidate, uint256 votes);
    event RegionCheck(Region region);
    event Results(string[][] results);
    event Winner(string winner);

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

    modifier alreadyEnded {
        require(hasEnded == true);
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

    //Unused Function at the moment. Possibly to create vote platforms that are allowed to do the voting.
    function addSystem(address pollsystem) public adminOnly hasNotStarted {
        allowedsystems[pollsystem] = true;
    }

    //Unused Function at the moment. Possibly to remove vote platforms that are allowed to do the voting.
    function removeSystem(address pollsystem) public adminOnly hasNotStarted {
        allowedsystems[pollsystem] = false;
    }

    function addCandidate(string memory _name, uint16 _regionId, string memory _candidateTitle) public adminOnly hasNotStarted {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _regionId, _candidateTitle, true);
        regions[_regionId].candidatesList.push(candidatesCount);
    }

    function addRegion(string memory _name, string memory _regionTitle) public adminOnly hasNotStarted {
        uint16[] memory candidatesList;
        regionsCount++;
        regions[regionsCount] = Region(regionsCount, _name, candidatesList, _regionTitle, true);
    }


    function addVoters(string[] memory _nricList, string[] memory _passwordList, uint16 regionId) public adminOnly hasNotStarted {
        require (_nricList.length > 0, "Lists must contain something");
        require (_nricList.length == _passwordList.length, "Both lists must be the same length");
        for (uint i = 0; i < _nricList.length; ++i) {
            voters[keccak256(abi.encodePacked(_nricList[i]))] = keccak256(abi.encodePacked(_passwordList[i]));
            voterRegions[keccak256(abi.encodePacked(_nricList[i]))] = regionId;
        }

        emit VotersAddedInRegion(regionId, _nricList.length);
    }

    /*
     * @dev Authenticates the voter, approves the voting based on the system and approves the vote if successful. 
     */
    function vote(string memory _nric, string memory _password, uint16 _candidateId) public {
        require(hasStarted == true && hasEnded == false, "Error, not available for voting");
        require(voters[keccak256(abi.encodePacked(_nric))] == keccak256(abi.encodePacked(_password)), "Error, authentication failure");
        require(hasRegisteredVote[keccak256(abi.encodePacked(_nric))] == false, "Has already voted");
        

        uint16 regionid = voterRegions[keccak256(abi.encodePacked(_nric))];
        Region memory voterRegion = regions[regionid];
        emit RegionCheck(voterRegion);
        require(voterRegion.valid, "Invalid Region");

        // add voteCode to voteCodes[] for testing
        // voteCodes.push(voteCode);

        uint16[] memory voterRegionCandidates = regions[regionid].candidatesList;
        bool found = false;
        for (uint16 i=0; i<voterRegionCandidates.length; i++) {
            if(voterRegionCandidates[i] == _candidateId) {
                found = true;
                break;
            }
        }
        require(found == true, "Error, invalid candidateId");
        hasRegisteredVote[keccak256(abi.encodePacked(_nric))] = true;

        votes[keccak256(abi.encodePacked(_nric))] = keccak256(abi.encodePacked(_candidateId)); //Encrypt candidate id and nric

        emit VoteSucceeded();
        //voteCodes.(_voteCode); //Voted
        //add vote to count.

        votecounts[keccak256(abi.encodePacked(_candidateId))] += 1;
    }

    // function vote(bytes32 _voteCode, uint16 _candidateId) public {
    //     //require(voteValidity[_voteCode] > 0, "Error, voteCode is not valid");
        
    //     require(votes[_voteCode] == bytes32(0), "Error, vote has already been cast");

    //     emit VoteTried(_voteCode);

    //     uint16[] memory voterRegionCandidates = regions[voteValidity[_voteCode]].candidatesList;
    //     bool found = false;
    //     for (uint16 i=0; i<voterRegionCandidates.length; i++) {
    //         if(voterRegionCandidates[i] == _candidateId) {
    //             found = true;
    //             break;
    //         }
    //     }
    //     require(found == true, "Error, invalid candidateId");

    //     votes[_voteCode] = keccak256(abi.encodePacked(_candidateId)); //Encrypt candidate id only

    //     emit VoteSucceeded();
    //     //voteCodes.(_voteCode); //Voted
    //     //add vote to count.

    //     votecounts[keccak256(abi.encodePacked(_candidateId))] += 1;
    // }

    function getCandidatesByRegion(uint16 _regionId) public view returns (uint16[] memory) {
        return regions[_regionId].candidatesList;
    }

    function getRegionByVoter(string memory _nric, string memory _password) public view returns (uint16) {
        require(voters[keccak256(abi.encodePacked(_nric))] == keccak256(abi.encodePacked(_password)), "Error, authentication failure");
        return voterRegions[keccak256(abi.encodePacked(_nric))];
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
    function settleResults() public adminOnly {
        require(hasEnded == true, "Result not available yet");
        require(results.length == 0, "Results already settled");

        for (uint i = 1; i <= regionsCount; i++) {
            //Handle Results on a per region basis
            Region memory regionCheck = regions[i];
            uint maxCount = 0;
            uint winner = 0;

            for (uint j = 0; j < regionCheck.candidatesList.length; j++) {
                uint256 votecount =  votecounts[keccak256(abi.encodePacked(regionCheck.candidatesList[j]))];
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

        emit Results(results);
    }

    function getWinner(string memory _regionname) public returns (string memory) {
        require(hasEnded, "Error, election has not ended yet");
        require(results.length > 0, "Results not set up yet");
        for (uint i = 0; i < results.length; i++) {
            if (StringUtils.equal(_regionname, results[i][0])) {
                emit Winner(results[i][1]);
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

    function getVoteCount(uint16 _candidateId) public view alreadyEnded returns (uint256) {
        return votecounts[keccak256(abi.encodePacked(_candidateId))];
    }

    function getAllowedRegion(string memory _nric) public view returns (uint16) {
        return voterRegions[keccak256(abi.encodePacked(_nric))];
    }
 }