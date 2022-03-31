// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


/** 
 * @dev The Election Administrator Contract contains the information of all election administrators. Due to the nature of the elections, 
 * the election administrators' addresses will change over time. Therefore a seperate logical contract is a good idea to keep track of such changes.
 * 
 * The majority of an administration's functions will be on the election contracts.
 */
contract ElectionAdministrator {
    
    mapping (address => bool) private administrators;
    mapping (address => address) private administratorsPendingRemoval; //Removing Single Point of Failure, requires more than one admin to approve a removal process.

    event AdministratorAdded(address newAdministrator, address addedBy);
    event AdministratorAlreadyExists(address administrator);
    event AlreadyPendingRemoval(address administrator);
    event AdministratorSetPendingRemoval(address administratorToRemove, address removedBy);
    event AdministratorApprovedRemoval(address administratorToRemove, address removedBy, address approvedBy);
    event AdministratorRejectRemoval(address administratorToRemove, address removedBy, address rejectedBy);
    event AdministratorDoesNotExist(address adminisrtrator);

    constructor () {
        administrators[msg.sender] = true;
    }

    modifier adminOnly {
        require (administrators[msg.sender], "Admin only");
        _;
    }

    function addAdministrator(address newAdministrator) public adminOnly {
        if (administrators[newAdministrator]) {
            emit AdministratorAlreadyExists(newAdministrator);
        } else {
            administrators[newAdministrator] = true;
            emit AdministratorAdded(newAdministrator, msg.sender);
        }
    }

    function setPendingRemoval(address administratorToRemove) public adminOnly {
        if (administrators[administratorToRemove]) {
            if (administratorsPendingRemoval[administratorToRemove] != address(0)) {
                emit AlreadyPendingRemoval(administratorToRemove);
            } else {
                administratorsPendingRemoval[administratorToRemove] = msg.sender;
                emit AdministratorSetPendingRemoval(administratorToRemove, msg.sender);
            }
        } else {
            emit AdministratorDoesNotExist(administratorToRemove);
        }   
    }

    function approveRemoval(address administratorToRemove) public adminOnly {
        require (msg.sender != administratorToRemove, "You cannot approve or reject a removal of yourself");
        require (administratorsPendingRemoval[administratorToRemove] != msg.sender, "You cannot approve a removal that you have made.");
        require (administratorsPendingRemoval[administratorToRemove] != address(0), "The administrator has not been set to pending removal yet");

        address removedBy = administratorsPendingRemoval[administratorToRemove];
        administrators[administratorToRemove] = false;
        administratorsPendingRemoval[administratorToRemove] = address(0);

        emit AdministratorApprovedRemoval(administratorToRemove, removedBy, msg.sender);
    }

    function rejectRemoval(address administratorToRemove) public adminOnly {
        require (msg.sender != administratorToRemove, "You cannot approve or reject a removal of yourself");
        require (administratorsPendingRemoval[administratorToRemove] != address(0), "The administrator has not been set to pending removal yet");

        address removedBy = administratorsPendingRemoval[administratorToRemove];
        administratorsPendingRemoval[administratorToRemove] = address(0);

        emit AdministratorRejectRemoval(administratorToRemove, removedBy, msg.sender);
    }

    function isAdministrator(address check) public view returns (bool) {
        return administrators[check];
    }
}