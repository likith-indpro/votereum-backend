// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Election
 * @dev Manages a single election with candidates and voting
 */
contract Election {
    string public name;
    string public description;
    uint256 public startTime;
    uint256 public endTime;
    address public organizer;
    bool public resultsDeclared;

    struct Candidate {
        uint256 id;
        string name;
        string information;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    uint256 public candidatesCount;
    
    mapping(address => bool) public hasVoted;
    uint256 public totalVotes;

    event VoteCast(address indexed voter, uint256 candidateId);
    event CandidateAdded(uint256 candidateId, string name);
    event ResultsDeclared();
    event ElectionTimesUpdated(uint256 newStartTime, uint256 newEndTime);

    constructor(
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        address _organizer
    ) {
        name = _name;
        description = _description;
        startTime = _startTime;
        endTime = _endTime;
        organizer = _organizer;
    }

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer can call this function");
        _;
    }

    modifier electionOngoing() {
       // require(block.timestamp >= startTime, "Election has not started yet");
       // require(block.timestamp <= endTime, "Election has ended");
        _;
    }

    modifier electionEnded() {
        require(block.timestamp > endTime, "Election has not ended yet");
        _;
    }

    // Around line 67
    
    function addCandidate(string memory _name, string memory _information) public onlyOrganizer {
        // Comment out this line for demo purposes
        // require(block.timestamp < startTime, "Cannot add candidate after election has started");
        
        candidatesCount++;
        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            information: _information,
            voteCount: 0
        });
        
        emit CandidateAdded(candidatesCount, _name);
    }

    function vote(uint256 _candidateId) public electionOngoing {
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId);
    }

    function declareResults() public onlyOrganizer electionEnded {
        resultsDeclared = true;
        emit ResultsDeclared();
    }

    /**
     * @dev Update the election start and end times
     * @param _startTime New start time (unix timestamp)
     * @param _endTime New end time (unix timestamp)
     */
    function updateElectionTimes(uint256 _startTime, uint256 _endTime) public onlyOrganizer {
        // Don't allow changes after voting has started
        require(totalVotes == 0, "Cannot change times after voting has started");
        
        // Validate new times
        require(_endTime > _startTime, "End time must be after start time");
        
        // Update the times
        startTime = _startTime;
        endTime = _endTime;
        
        // Emit event so everyone knows about the change
        emit ElectionTimesUpdated(startTime, endTime);
    }

    function getCandidate(uint256 _candidateId) public view returns (
        uint256 id,
        string memory name,
        string memory information,
        uint256 voteCount
    ) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        
        Candidate storage candidate = candidates[_candidateId];
        
        // Only return vote count if results are declared or caller is organizer
        uint256 votes = resultsDeclared || msg.sender == organizer ? candidate.voteCount : 0;
        
        return (
            candidate.id,
            candidate.name,
            candidate.information,
            votes
        );
    }

    function hasUserVoted(address _voter) public view returns (bool) {
        return hasVoted[_voter];
    }
}