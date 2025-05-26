// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Election.sol";

/**
 * @title ElectionFactory
 * @dev Creates and manages elections
 */
contract ElectionFactory {
    address public owner;
    
    struct ElectionInfo {
        address electionAddress;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        address organizer;
    }

    ElectionInfo[] public elections;
    mapping(address => ElectionInfo[]) private organizerElections;
    
    event ElectionCreated(
        address indexed electionAddress,
        string name,
        uint256 startTime,
        uint256 endTime,
        address indexed organizer
    );

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Create a new election
     */
    function createElection(
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) public returns (address) {
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        Election newElection = new Election(
            _name,
            _description,
            _startTime,
            _endTime,
            msg.sender
        );
        
        address electionAddress = address(newElection);
        
        ElectionInfo memory electionInfo = ElectionInfo({
            electionAddress: electionAddress,
            name: _name,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            organizer: msg.sender
        });
        
        elections.push(electionInfo);
        organizerElections[msg.sender].push(electionInfo);
        
        emit ElectionCreated(
            electionAddress,
            _name,
            _startTime,
            _endTime,
            msg.sender
        );
        
        return electionAddress;
    }
    
    /**
     * @dev Get the number of elections
     */
    function getElectionsCount() public view returns (uint256) {
        return elections.length;
    }
    
    /**
     * @dev Get all elections for a specific organizer
     */
    function getOrganizerElections() public view returns (ElectionInfo[] memory) {
        return organizerElections[msg.sender];
    }
}