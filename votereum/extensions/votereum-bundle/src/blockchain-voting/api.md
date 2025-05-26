# Blockchain Voting API Documentation

## Overview

This API allows interaction with the blockchain-based voting system, enabling election creation, voting, and result retrieval.

## Endpoints

### Create Election

- **URL**: `/blockchain-voting/election`
- **Method**: `POST`
- **Description**: Creates a new election on the blockchain and stores its metadata in Directus
- **Request Body**:
  ```json
  {
    "title": "Board Election 2024",
    "description": "Annual board member election",
    "startTime": "2024-06-01T00:00:00Z",
    "endTime": "2024-06-08T00:00:00Z",
    "candidatesList": [
      {
        "name": "John Doe",
        "description": "Board member candidate",
        "email": "john@example.com"
      }
    ],
    "adminWallet": "0x123...",
    "company_meta_id": "uuid-string"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "id": "uuid-string",
      "name": "Board Election 2024",
      "description": "Annual board member election",
      "blockchain_address": "0x123...",
      "authority_addr": "0x123...",
      "status": false,
      "company_meta": "uuid-string"
    }
  }
  ```

### Get Election Results

- **URL**: `/blockchain-voting/election/:id/results`
- **Method**: `GET`
- **Description**: Retrieves election results from the blockchain
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "1",
        "name": "John Doe",
        "information": "Board member candidate",
        "voteCount": "5"
      }
    ]
  }
  ```

### Cast Vote

- **URL**: `/blockchain-voting/vote`
- **Method**: `POST`
- **Description**: Casts a vote for a specific candidate in an election
- **Request Body**:
  ```json
  {
    "electionId": "uuid-string",
    "candidateId": 1,
    "voterAddress": "0x456...",
    "signature": "signature-string",
    "message": "message-to-sign"
  }
  ```
- **Response**:
  ```json
  {
    "success": true
  }
  ```

### List Elections

- **URL**: `/blockchain-voting/elections`
- **Method**: `GET`
- **Description**: Lists all elections with their details
- **Query Parameters**:
  - `status`: Filter by election status (optional)
  - `includeBlockchain`: Include blockchain details (optional, defaults to false)
  - `limit`: Limit number of results (optional)
  - `page`: Pagination (optional)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid-string",
        "name": "Board Election 2024",
        "description": "Annual board member election",
        "blockchain_address": "0x123...",
        "authority_addr": "0x456...",
        "status": true,
        "company_meta": {
          "id": "uuid-string",
          "election_name": "Company Board Election"
        },
        "date_created": "2024-05-15T10:30:00Z",
        "candidates": [
          {
            "id": "uuid-string",
            "name": "John Doe"
          }
        ]
      }
    ],
    "meta": {
      "total_count": 5,
      "page": 1,
      "limit": 10
    }
  }
  ```
