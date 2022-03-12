pragma solidity ^0.8.0;

contract Election {

    mapping (address => bool) administrators;

    string public electionTitle;
    uint public startDate;
    uint public endDate;
    bool public hasStarted;
    bool public hasEnded;


    constructor(string memory _electionTitle, uint256 _startDate, uint256 _endDate) public {
        electionTitle = _electionTitle;
        _startDate = _startDate;
        _endDate = _endDate;
        hasStarted = false; 
        hasEnded = false;

        administrators[msg.sender] = true;
    }

}