import { VotereumClient } from "./VotereumClient";
import * as crypto from "crypto";

/**
 * Votereum Directus Middleware - Integration layer between Directus CMS and blockchain contracts
 */
export class DirectusMiddleware {
  private client: VotereumClient;
  private adminPrivateKey: string;

  /**
   * Create a new DirectusMiddleware instance
   * @param rpcUrl The Ethereum RPC URL to connect to
   * @param factoryAddress The address of the deployed VotereumFactory contract
   * @param adminPrivateKey The private key of the admin account
   */
  constructor(rpcUrl: string, factoryAddress: string, adminPrivateKey: string) {
    this.client = new VotereumClient(rpcUrl, factoryAddress);
    this.adminPrivateKey = adminPrivateKey;
  }

  /**
   * Initialize the middleware and connect admin wallet
   */
  public async initialize(): Promise<string> {
    // Connect admin wallet
    const adminAddress = await this.client.connectWallet(this.adminPrivateKey);

    // Initialize contracts
    await this.client.initialize();

    return adminAddress;
  }

  /**
   * Sync an election from Directus to the blockchain
   * @param election The election data from Directus
   * @returns The blockchain election ID
   */
  public async syncElectionToBlockchain(election: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    minimum_age: number;
    max_votes_per_user: number;
    enforce_kyc: boolean;
  }): Promise<number> {
    // Convert dates to Unix timestamps
    const startTime = Math.floor(
      new Date(election.start_date).getTime() / 1000
    );
    const endTime = Math.floor(new Date(election.end_date).getTime() / 1000);

    // Create election on blockchain
    const electionId = await this.client.createElection(
      election.title,
      election.description,
      startTime,
      endTime,
      election.minimum_age || 18,
      election.max_votes_per_user || 1,
      election.enforce_kyc || false
    );

    return electionId;
  }

  /**
   * Sync a candidate from Directus to the blockchain
   * @param candidate The candidate data from Directus
   * @param blockchainElectionId The blockchain election ID
   */
  public async syncCandidateToBlockchain(
    candidate: {
      id: string;
      name: string;
      description: string;
      election_id: string;
    },
    blockchainElectionId: number
  ): Promise<void> {
    await this.client.addCandidate(
      blockchainElectionId,
      candidate.name,
      candidate.description || ""
    );
  }

  /**
   * Verify a voter based on Directus verification request
   * @param verificationRequest The verification request data
   * @param voterAddress The Ethereum address of the voter
   */
  public async verifyVoter(
    verificationRequest: {
      id: string;
      user_id: string;
      status: string;
      kyc_approved: boolean;
      age: number;
      region: string;
      document_hash?: string;
    },
    voterAddress: string
  ): Promise<void> {
    // Generate verification hash from document hash or create a new one
    const verificationHash =
      verificationRequest.document_hash ||
      crypto
        .createHash("sha256")
        .update(`${verificationRequest.id}-${Date.now()}`)
        .digest("hex");

    // Verify voter on blockchain
    await this.client.verifyVoter(
      voterAddress,
      verificationRequest.kyc_approved || false,
      verificationRequest.age || 0,
      verificationRequest.region || "",
      verificationHash
    );
  }

  /**
   * Record a vote from Directus to the blockchain
   * @param vote The vote data from Directus
   * @param voterPrivateKey The private key of the voter
   */
  public async castVote(
    vote: {
      election_id: string;
      candidate_id: string;
      blockchain_election_id: number;
      blockchain_candidate_id: number;
    },
    voterPrivateKey: string
  ): Promise<void> {
    // Switch to voter wallet
    await this.client.connectWallet(voterPrivateKey);

    // Cast vote
    await this.client.vote(
      vote.blockchain_election_id,
      vote.blockchain_candidate_id
    );

    // Switch back to admin wallet
    await this.client.connectWallet(this.adminPrivateKey);
  }

  /**
   * Update election state on the blockchain (start or end)
   * @param blockchainElectionId The blockchain election ID
   * @param action 'start' or 'end'
   */
  public async updateElectionState(
    blockchainElectionId: number,
    action: "start" | "end"
  ): Promise<void> {
    if (action === "start") {
      await this.client.startElection(blockchainElectionId);
    } else if (action === "end") {
      await this.client.endElection(blockchainElectionId);
    }
  }

  /**
   * Sync blockchain election results to Directus
   * @param blockchainElectionId The blockchain election ID
   * @returns The election results
   */
  public async getElectionResults(blockchainElectionId: number): Promise<{
    candidates: Array<{
      id: number;
      name: string;
      voteCount: number;
    }>;
    totalVotes: number;
  }> {
    return await this.client.getElectionResults(blockchainElectionId);
  }

  /**
   * Sync voter details from blockchain to Directus
   * @param voterAddress The Ethereum address of the voter
   */
  public async getVoterInfo(voterAddress: string): Promise<{
    isRegistered: boolean;
    isVerified: boolean;
    hasKYC: boolean;
    age: number;
    region: string;
  }> {
    return await this.client.getVoterInfo(voterAddress);
  }

  /**
   * Check if a voter is eligible for an election
   * @param voterAddress The Ethereum address of the voter
   * @param blockchainElectionId The blockchain election ID
   */
  public async isVoterEligible(
    voterAddress: string,
    blockchainElectionId: number
  ): Promise<boolean> {
    return await this.client.isVoterEligible(
      voterAddress,
      blockchainElectionId
    );
  }

  /**
   * Check if a voter has voted in an election
   * @param voterAddress The Ethereum address of the voter
   * @param blockchainElectionId The blockchain election ID
   */
  public async hasVoterVoted(
    voterAddress: string,
    blockchainElectionId: number
  ): Promise<boolean> {
    return await this.client.hasVoted(voterAddress, blockchainElectionId);
  }

  /**
   * Add a verifier to the blockchain
   * @param verifierAddress The Ethereum address of the verifier
   */
  public async addVerifier(verifierAddress: string): Promise<void> {
    await this.client.addVerifier(verifierAddress);
  }

  /**
   * Setup event listeners to sync blockchain events to Directus
   * @param callbacks Object containing callback functions for different events
   */
  public setupEventListeners(callbacks: {
    onVoteCast?: (
      electionId: number,
      candidateId: number,
      voterAddress: string
    ) => void;
    onElectionCreated?: (
      electionId: number,
      title: string,
      creator: string
    ) => void;
    onElectionStateChanged?: (electionId: number, newState: string) => void;
  }): void {
    // Listen for votes
    if (callbacks.onVoteCast) {
      this.client.listenForVotes(callbacks.onVoteCast);
    }

    // Listen for new elections
    if (callbacks.onElectionCreated) {
      this.client.listenForNewElections(callbacks.onElectionCreated);
    }

    // Listen for election state changes
    if (callbacks.onElectionStateChanged) {
      this.client.listenForElectionStateChanges(
        callbacks.onElectionStateChanged
      );
    }
  }
}
