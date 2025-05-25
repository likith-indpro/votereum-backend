import { defineEndpoint } from "@directus/extensions-sdk";
import { ethers } from "ethers";
import ElectionFactory from "../../contracts/ElectionFactory.json";

export default defineEndpoint((router, { services, exceptions }) => {
  const { ItemsService } = services;
  const { ServiceUnavailableException } = exceptions;

  // Set up provider - you might want to make this configurable
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
  );

  // Connect to contract using ABI and address
  const factoryContract = new ethers.Contract(
    process.env.ELECTION_FACTORY_ADDRESS,
    ElectionFactory.abi,
    provider
  );

  // Create a new election
  router.post("/election", async (req, res, next) => {
    try {
      const {
        title,
        description,
        startTime,
        endTime,
        candidatesList,
        adminWallet,
      } = req.body;

      // Create wallet using admin private key (should be secured properly)
      const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
      const connectedContract = factoryContract.connect(wallet);

      // Create election on blockchain
      const tx = await connectedContract.createElection(
        title,
        description,
        Math.floor(new Date(startTime).getTime() / 1000),
        Math.floor(new Date(endTime).getTime() / 1000)
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get election address from event logs (you'll need to implement this based on your contract)
      const electionAddress = extractElectionAddressFromLogs(receipt.logs);

      // Add election to Directus
      const electionsService = new ItemsService("elections", {
        accountability: req.accountability,
        schema: req.schema,
      });

      const election = await electionsService.createOne({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        blockchain_address: electionAddress,
        admin_wallet: adminWallet,
        status: "active",
      });

      // Add candidates to the election on blockchain and in Directus
      await addCandidatesToElection(
        electionAddress,
        candidatesList,
        wallet,
        req
      );

      res.json({ data: election });
    } catch (error) {
      next(new ServiceUnavailableException(error.message));
    }
  });

  // Get election results
  router.get("/election/:id/results", async (req, res, next) => {
    try {
      // Get election from Directus
      const electionsService = new ItemsService("elections", {
        accountability: req.accountability,
        schema: req.schema,
      });

      const election = await electionsService.readOne(req.params.id);

      // Connect to specific election contract
      const electionContract = new ethers.Contract(
        election.blockchain_address,
        Election.abi, // You'll need the Election contract ABI
        provider
      );

      // Get results from blockchain
      const candidatesCount = await electionContract.candidatesCount();
      const results = [];

      for (let i = 1; i <= candidatesCount; i++) {
        const candidate = await electionContract.getCandidate(i);
        results.push({
          id: candidate.id.toString(),
          name: candidate.name,
          information: candidate.information,
          voteCount: candidate.voteCount.toString(),
        });
      }

      res.json({ data: results });
    } catch (error) {
      next(new ServiceUnavailableException(error.message));
    }
  });

  // Vote endpoint
  router.post("/vote", async (req, res, next) => {
    try {
      const { electionId, candidateId, voterAddress, signature } = req.body;

      // Verify the signature to ensure the request is coming from the actual voter
      const isValidSignature = verifySignature(
        voterAddress,
        signature,
        candidateId
      );
      if (!isValidSignature) {
        throw new Error("Invalid signature");
      }

      // Get election from Directus
      const electionsService = new ItemsService("elections", {
        accountability: req.accountability,
        schema: req.schema,
      });

      const election = await electionsService.readOne(electionId);

      // Connect to election contract with voter's signed transaction
      // Note: In a real implementation, you'll need to handle this differently
      // as the voter would sign the transaction directly from their wallet

      // Record the vote in Directus for analytics
      const votesService = new ItemsService("votes", {
        accountability: req.accountability,
        schema: req.schema,
      });

      await votesService.createOne({
        election_id: electionId,
        voter_address: voterAddress,
        candidate_id: candidateId,
        timestamp: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      next(new ServiceUnavailableException(error.message));
    }
  });

  // Helper functions
  function extractElectionAddressFromLogs(logs) {
    // Implementation depends on your contract events
    // Look for the event that emits the new election address
    return logs[0].args.electionAddress;
  }

  async function addCandidatesToElection(
    electionAddress,
    candidatesList,
    wallet,
    req
  ) {
    // Connect to election contract
    const electionContract = new ethers.Contract(
      electionAddress,
      Election.abi, // You'll need the Election contract ABI
      wallet
    );

    // Add candidates to blockchain
    for (const candidate of candidatesList) {
      await electionContract.addCandidate(
        candidate.name,
        candidate.information
      );
    }

    // Add candidates to Directus
    const candidatesService = new ItemsService("candidates", {
      accountability: req.accountability,
      schema: req.schema,
    });

    for (const candidate of candidatesList) {
      await candidatesService.createOne({
        name: candidate.name,
        information: candidate.information,
        election_id: electionAddress,
        image: candidate.image,
      });
    }
  }

  function verifySignature(address, signature, message) {
    // Implement signature verification
    // This ensures that the vote is coming from the claimed address
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }
});
