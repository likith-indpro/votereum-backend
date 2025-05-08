import { ethers } from "ethers";
import type { VotereumFactory } from "./types/contracts/VotereumFactory";
import { VotereumFactory__factory } from "./types/factories/contracts/VotereumFactory__factory";
import type { Voting } from "./types/contracts/Voting";
import { Voting__factory } from "./types/factories/contracts/Voting__factory";
import type { VoterVerification } from "./types/contracts/VoterVerification";
import { VoterVerification__factory } from "./types/factories/contracts/VoterVerification__factory";

/**
 * Votereum Client - Main integration library for the Votereum blockchain voting system
 * This client provides methods to interact with the Votereum smart contracts
 */
export class VotereumClient {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private votereumFactory?: VotereumFactory;
  private voting?: Voting;
  private voterVerification?: VoterVerification;

  /**
   * Create a new Votereum client instance
   * @param rpcUrl The Ethereum RPC URL to connect to
   * @param factoryAddress Address of the deployed VotereumFactory contract
   */
  constructor(
    private readonly rpcUrl: string,
    private readonly factoryAddress: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Connect a wallet to the client for signing transactions
   * @param privateKey The private key of the signer (admin, verifier, or voter)
   * @returns The connected wallet address
   */
  public async connectWallet(privateKey: string): Promise<string> {
    try {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      return await this.signer.getAddress();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw new Error("Failed to connect wallet: Invalid private key");
    }
  }

  /**
   * Initialize the client by connecting to all contracts
   */
  public async initialize(): Promise<void> {
    if (!this.factoryAddress) {
      throw new Error("Factory address is required");
    }

    try {
      // Get the factory contract
      this.votereumFactory = this.signer
        ? VotereumFactory__factory.connect(this.factoryAddress, this.signer)
        : VotereumFactory__factory.connect(this.factoryAddress, this.provider);

      // Get the addresses of child contracts
      const votingAddress = await this.votereumFactory.votingContract();
      const verificationAddress =
        await this.votereumFactory.voterVerificationContract();

      // Connect to child contracts
      this.voting = this.signer
        ? Voting__factory.connect(votingAddress, this.signer)
        : Voting__factory.connect(votingAddress, this.provider);

      this.voterVerification = this.signer
        ? VoterVerification__factory.connect(verificationAddress, this.signer)
        : VoterVerification__factory.connect(
            verificationAddress,
            this.provider
          );
    } catch (error) {
      console.error("Failed to initialize contracts:", error);
      throw new Error("Failed to initialize contracts");
    }
  }

  /*****************************
   * Election Management Functions
   *****************************/

  /**
   * Create a new election
   * @param title Election title
   * @param description Election description
   * @param startTime Start time (unix timestamp)
   * @param endTime End time (unix timestamp)
   * @param minimumAge Minimum voter age requirement
   * @param maxVotesPerUser Maximum number of votes allowed per user
   * @param enforceKYC Whether KYC verification is required
   * @returns The created election ID
   */
  public async createElection(
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    minimumAge: number,
    maxVotesPerUser: number,
    enforceKYC: boolean
  ): Promise<number> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.createElection(
        title,
        description,
        startTime,
        endTime,
        minimumAge,
        maxVotesPerUser,
        enforceKYC
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log) => log.fragment?.name === "ElectionCreated"
      );

      if (event && event.args) {
        return Number(event.args[0]); // electionId
      }

      // Fallback: get the current election count
      const electionCount = await this.votereumFactory!.votingContract()
        .then((addr) => Voting__factory.connect(addr, this.provider))
        .then((contract) => contract.electionCount());

      return Number(electionCount);
    } catch (error) {
      console.error("Failed to create election:", error);
      throw new Error("Failed to create election");
    }
  }

  /**
   * Add a candidate to an election
   * @param electionId Election ID
   * @param name Candidate name
   * @param description Candidate description
   */
  public async addCandidate(
    electionId: number,
    name: string,
    description: string
  ): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.addCandidate(
        electionId,
        name,
        description
      );
      await tx.wait();
    } catch (error) {
      console.error(
        `Failed to add candidate to election ${electionId}:`,
        error
      );
      throw new Error(`Failed to add candidate to election ${electionId}`);
    }
  }

  /**
   * Start an election
   * @param electionId Election ID
   */
  public async startElection(electionId: number): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.startElection(electionId);
      await tx.wait();
    } catch (error) {
      console.error(`Failed to start election ${electionId}:`, error);
      throw new Error(`Failed to start election ${electionId}`);
    }
  }

  /**
   * End an election
   * @param electionId Election ID
   */
  public async endElection(electionId: number): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.endElection(electionId);
      await tx.wait();
    } catch (error) {
      console.error(`Failed to end election ${electionId}:`, error);
      throw new Error(`Failed to end election ${electionId}`);
    }
  }

  /**
   * Get election details
   * @param electionId Election ID
   */
  public async getElectionDetails(electionId: number): Promise<{
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    state: string;
    totalVotes: number;
    candidateCount: number;
    minimumAge: number;
    maxVotesPerUser: number;
    enforceKYC: boolean;
  }> {
    this.requireFactory();

    try {
      const [
        title,
        description,
        startTime,
        endTime,
        state,
        totalVotes,
        candidateCount,
        minimumAge,
        maxVotesPerUser,
        enforceKYC,
      ] = await this.votereumFactory!.getElectionDetails(electionId);

      // Convert state number to string
      const stateString = this.getElectionStateString(state);

      return {
        title,
        description,
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        state: stateString,
        totalVotes: Number(totalVotes),
        candidateCount: Number(candidateCount),
        minimumAge: Number(minimumAge),
        maxVotesPerUser: Number(maxVotesPerUser),
        enforceKYC,
      };
    } catch (error) {
      console.error(`Failed to get election details for ${electionId}:`, error);
      throw new Error(`Failed to get election details for ${electionId}`);
    }
  }

  /**
   * Get all candidates for an election
   * @param electionId Election ID
   */
  public async getElectionCandidates(electionId: number): Promise<
    Array<{
      id: number;
      name: string;
      description: string;
      voteCount: number;
      isActive: boolean;
    }>
  > {
    this.requireVoting();

    try {
      const candidateCount = await this.voting!.candidatesCount(electionId);
      const candidates = [];

      for (let i = 1; i <= Number(candidateCount); i++) {
        const [id, name, description, voteCount, isActive] =
          await this.voting!.getCandidate(electionId, i);

        candidates.push({
          id: Number(id),
          name,
          description,
          voteCount: Number(voteCount),
          isActive,
        });
      }

      return candidates;
    } catch (error) {
      console.error(
        `Failed to get candidates for election ${electionId}:`,
        error
      );
      throw new Error(`Failed to get candidates for election ${electionId}`);
    }
  }

  /**
   * Get election results
   * @param electionId Election ID
   */
  public async getElectionResults(electionId: number): Promise<{
    candidates: Array<{
      id: number;
      name: string;
      voteCount: number;
    }>;
    totalVotes: number;
  }> {
    this.requireFactory();

    try {
      const [candidateIds, voteCounts, candidateNames] =
        await this.votereumFactory!.getElectionResults(electionId);

      const electionDetails = await this.getElectionDetails(electionId);

      const results = candidateIds.map((id, index) => ({
        id: Number(id),
        name: candidateNames[index],
        voteCount: Number(voteCounts[index]),
      }));

      return {
        candidates: results,
        totalVotes: electionDetails.totalVotes,
      };
    } catch (error) {
      console.error(`Failed to get results for election ${electionId}:`, error);
      throw new Error(`Failed to get results for election ${electionId}`);
    }
  }

  /*****************************
   * Voter Management Functions
   *****************************/

  /**
   * Register as a voter
   */
  public async registerAsVoter(): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.registerAsVoter();
      await tx.wait();
    } catch (error) {
      console.error("Failed to register as voter:", error);
      throw new Error("Failed to register as voter");
    }
  }

  /**
   * Add a verifier
   * @param verifierAddress The address to add as a verifier
   */
  public async addVerifier(verifierAddress: string): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.addVerifier(verifierAddress);
      await tx.wait();
    } catch (error) {
      console.error("Failed to add verifier:", error);
      throw new Error("Failed to add verifier");
    }
  }

  /**
   * Verify a voter
   * @param voterAddress The address of the voter to verify
   * @param hasKYC Whether the voter has completed KYC
   * @param age Voter's age
   * @param region Voter's region
   * @param verificationHash Hash of verification documents
   */
  public async verifyVoter(
    voterAddress: string,
    hasKYC: boolean,
    age: number,
    region: string,
    verificationHash: string
  ): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.verifyVoter(
        voterAddress,
        hasKYC,
        age,
        region,
        verificationHash
      );
      await tx.wait();
    } catch (error) {
      console.error(`Failed to verify voter ${voterAddress}:`, error);
      throw new Error(`Failed to verify voter ${voterAddress}`);
    }
  }

  /**
   * Get voter information
   * @param voterAddress The address of the voter
   */
  public async getVoterInfo(voterAddress: string): Promise<{
    isRegistered: boolean;
    isVerified: boolean;
    hasKYC: boolean;
    age: number;
    region: string;
  }> {
    this.requireFactory();

    try {
      const [isRegistered, isVerified, hasKYC, age, region] =
        await this.votereumFactory!.getVoterInfo(voterAddress);

      return {
        isRegistered,
        isVerified,
        hasKYC,
        age: Number(age),
        region,
      };
    } catch (error) {
      console.error(`Failed to get voter info for ${voterAddress}:`, error);
      throw new Error(`Failed to get voter info for ${voterAddress}`);
    }
  }

  /**
   * Check if a voter is eligible for an election
   * @param voterAddress The address of the voter
   * @param electionId The election ID
   */
  public async isVoterEligible(
    voterAddress: string,
    electionId: number
  ): Promise<boolean> {
    this.requireVoterVerification();

    try {
      const electionDetails = await this.getElectionDetails(electionId);

      return await this.voterVerification!.isEligible(
        voterAddress,
        electionDetails.minimumAge,
        electionDetails.enforceKYC,
        "" // No specific region requirement in this implementation
      );
    } catch (error) {
      console.error(
        `Failed to check eligibility for voter ${voterAddress}:`,
        error
      );
      throw new Error(`Failed to check eligibility for voter ${voterAddress}`);
    }
  }

  /**
   * Check if a voter has voted in an election
   * @param voterAddress The address of the voter
   * @param electionId The election ID
   */
  public async hasVoted(
    voterAddress: string,
    electionId: number
  ): Promise<boolean> {
    this.requireFactory();

    try {
      return await this.votereumFactory!.hasVoted(voterAddress, electionId);
    } catch (error) {
      console.error(
        `Failed to check if voter ${voterAddress} has voted:`,
        error
      );
      throw new Error(`Failed to check if voter ${voterAddress} has voted`);
    }
  }

  /*****************************
   * Voting Functions
   *****************************/

  /**
   * Cast a vote for a candidate in an election
   * @param electionId The election ID
   * @param candidateId The candidate ID to vote for
   */
  public async vote(electionId: number, candidateId: number): Promise<void> {
    this.requireSigner();
    this.requireFactory();

    try {
      const tx = await this.votereumFactory!.vote(electionId, candidateId);
      await tx.wait();
    } catch (error) {
      console.error(`Failed to cast vote in election ${electionId}:`, error);
      throw new Error(`Failed to cast vote in election ${electionId}`);
    }
  }

  /*****************************
   * Event Listening Functions
   *****************************/

  /**
   * Listen for new elections
   * @param callback Function to call when a new election is created
   */
  public listenForNewElections(
    callback: (electionId: number, title: string, creator: string) => void
  ): void {
    this.requireFactory();

    this.votereumFactory!.on(
      "ElectionCreated",
      (electionId, title, creator) => {
        callback(Number(electionId), title, creator);
      }
    );
  }

  /**
   * Listen for votes cast
   * @param callback Function to call when a vote is cast
   */
  public listenForVotes(
    callback: (electionId: number, candidateId: number, voter: string) => void
  ): void {
    this.requireVoting();

    this.voting!.on("VoteCast", (electionId, candidateId, voter) => {
      callback(Number(electionId), Number(candidateId), voter);
    });
  }

  /**
   * Listen for election state changes
   * @param callback Function to call when an election state changes
   */
  public listenForElectionStateChanges(
    callback: (electionId: number, newState: string) => void
  ): void {
    this.requireVoting();

    this.voting!.on("ElectionStateChanged", (electionId, newState) => {
      const stateString = this.getElectionStateString(newState);
      callback(Number(electionId), stateString);
    });
  }

  /*****************************
   * Helper Functions
   *****************************/

  /**
   * Require the signer to be connected
   */
  private requireSigner(): void {
    if (!this.signer) {
      throw new Error("Wallet not connected. Call connectWallet first.");
    }
  }

  /**
   * Require the factory contract to be initialized
   */
  private requireFactory(): void {
    if (!this.votereumFactory) {
      throw new Error("Contracts not initialized. Call initialize first.");
    }
  }

  /**
   * Require the voting contract to be initialized
   */
  private requireVoting(): void {
    if (!this.voting) {
      throw new Error("Contracts not initialized. Call initialize first.");
    }
  }

  /**
   * Require the voter verification contract to be initialized
   */
  private requireVoterVerification(): void {
    if (!this.voterVerification) {
      throw new Error("Contracts not initialized. Call initialize first.");
    }
  }

  /**
   * Convert election state number to string
   * @param state The election state as a number
   */
  private getElectionStateString(state: number | bigint): string {
    const stateNum = Number(state);
    switch (stateNum) {
      case 0:
        return "Created";
      case 1:
        return "Active";
      case 2:
        return "Ended";
      case 3:
        return "Finalized";
      default:
        return "Unknown";
    }
  }
}
