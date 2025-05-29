import { defineEndpoint } from "@directus/extensions-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { start } from "repl";

// Load environment variables
dotenv.config();

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to deployment files - handle missing files gracefully
let ElectionFactory, Election;
try {
  // Import contract ABIs from blockchain folder - updating paths to exact location
  // Use absolute paths to ensure file location is correct
  const electionFactoryPath =
    "C:\\Users\\likit\\OneDrive\\Desktop\\Votereum\\votereum-backend\\blockchain\\artifacts\\contracts\\ElectionFactory.sol\\ElectionFactory.json";

  const electionPath =
    "C:\\Users\\likit\\OneDrive\\Desktop\\Votereum\\votereum-backend\\blockchain\\artifacts\\contracts\\Election.sol\\Election.json";

  console.log("Looking for ElectionFactory at:", electionFactoryPath);
  console.log("Looking for Election at:", electionPath);

  // Read contract ABIs if they exist
  if (fs.existsSync(electionFactoryPath)) {
    ElectionFactory = JSON.parse(fs.readFileSync(electionFactoryPath, "utf8"));
    console.log("Successfully loaded ElectionFactory ABI");
  } else {
    console.warn("ElectionFactory.json not found, using empty ABI");
    ElectionFactory = {
      abi: [],
      address: process.env.ELECTION_FACTORY_ADDRESS,
    };
  }

  if (fs.existsSync(electionPath)) {
    Election = JSON.parse(fs.readFileSync(electionPath, "utf8"));
    console.log("Successfully loaded Election ABI");
  } else {
    console.warn("Election.json not found, using empty ABI");
    Election = { abi: [] };
  }
} catch (err) {
  console.error("Error loading contract ABIs:", err);
  // Provide fallbacks so the endpoint can still load
  ElectionFactory = { abi: [], address: process.env.ELECTION_FACTORY_ADDRESS };
  Election = { abi: [] };
}

export default defineEndpoint((router, { services, getSchema }) => {
  // Fix for exceptions being undefined
  const ServiceUnavailableException = Error;

  // Set up provider - updated for ethers v6
  const provider = new ethers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545"
  );

  // Check if we have a valid factory address
  const factoryAddress =
    process.env.ELECTION_FACTORY_ADDRESS || ElectionFactory.address || null;

  // Only create contract if we have a valid address
  let factoryContract = null;
  if (
    factoryAddress &&
    factoryAddress.startsWith("0x") &&
    factoryAddress.length === 42
  ) {
    try {
      factoryContract = new ethers.Contract(
        factoryAddress,
        ElectionFactory.abi,
        provider
      );
      console.log(`Connected to ElectionFactory at ${factoryAddress}`);
    } catch (err) {
      console.error("Failed to create ElectionFactory contract:", err);
    }
  } else {
    console.warn(
      "No valid ElectionFactory address found, blockchain features will be unavailable"
    );
  }

  // Add this new endpoint to your existing exports

  // Verify signature endpoint
  router.post("/verify-signature", async (req, res, next) => {
    try {
      const { message, signature, address } = req.body;

      // If address is provided, verify that address
      // Otherwise, just return the recovered address
      if (address) {
        const isValid = verifySignature(address, signature, message);
        res.json({ data: { isValid } });
      } else {
        // Recover address from signature
        try {
          const recoveredAddress = ethers.verifyMessage(message, signature);
          res.json({ data: { address: recoveredAddress } });
        } catch (error) {
          console.error("Error recovering address from signature:", error);
          throw new Error("Invalid signature format");
        }
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      next(
        new ServiceUnavailableException(
          error.message || "An error occurred while verifying the signature"
        )
      );
    }
  });

  // Create a new election
  router.post("/election", async (req, res, next) => {
    try {
      let {
        title,
        description,
        startTime,
        endTime,
        candidatesList,
        adminWallet,
      } = req.body;

      // For testing/demo: If no startTime is specified, or if there's a demo flag,
      // set startTime to yesterday automatically
      const demoMode = req.body.demoMode === true;

      if (!startTime || demoMode) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        startTime = yesterday.toISOString();
        console.log(
          "🚧 DEMO MODE: Setting election start time to yesterday:",
          startTime
        );
      }

      // Ensure end time is in the future
      if (!endTime) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        endTime = nextYear.toISOString();
      }

      // Check if blockchain integration is available
      if (!factoryContract) {
        throw new Error(
          "Blockchain integration is not available. Check your ELECTION_FACTORY_ADDRESS environment variable."
        );
      }

      // Create ItemsService for elections
      const schema = await getSchema();
      const ItemsService = services.ItemsService;
      const electionsService = new ItemsService("elections", {
        schema,
        accountability: req.accountability,
      });

      // Create wallet using admin private key (should be secured properly)
      const wallet = new ethers.Wallet(
        process.env.ADMIN_PRIVATE_KEY || "",
        provider
      );
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

      // Get election address from event logs
      const electionAddress = extractElectionAddressFromLogs(receipt);

      // Add election to Directus
      // Ensure company_meta_id is a valid UUID
      let companyMetaId = req.body.company_meta_id;

      // If it appears to be a numeric ID, fetch the actual UUID
      if (
        companyMetaId &&
        (typeof companyMetaId === "number" || /^\d+$/.test(companyMetaId))
      ) {
        try {
          // Create ItemsService for companies_meta
          const companiesService = new ItemsService("companies_meta", {
            schema,
            accountability: req.accountability,
          });

          // Try to get the company record by numeric ID
          const companies = await companiesService.readByQuery({
            limit: 1,
          });

          if (companies && companies.length > 0) {
            // Use the first company's UUID if available
            companyMetaId = companies[0].id;
            console.log(`Using company UUID: ${companyMetaId}`);
          }
        } catch (err) {
          console.error("Error fetching company meta:", err);
          // Continue with the original ID if fetch fails
        }
      }

      const election = await electionsService.createOne({
        name: title,
        description: description,
        authority_addr: adminWallet,
        status: false, // Not active yet
        company_meta: companyMetaId, // Now using proper UUID
        blockchain_address: electionAddress, // Store blockchain address in Directus
        start_time: new Date(startTime),
        end_time: new Date(endTime),
      });

      // IMPORTANT: Make sure we have the election ID
      if (!election || !election.id) {
        console.error("Warning: Created election has no ID", election);
        // Try to fetch the just-created election
        try {
          const createdElections = await electionsService.readByQuery({
            filter: {
              blockchain_address: {
                _eq: electionAddress,
              },
            },
            limit: 1,
          });

          if (createdElections && createdElections.length > 0) {
            console.log(
              "Retrieved election ID from database:",
              createdElections[0].id
            );
            election.id = createdElections[0].id;
          }
        } catch (err) {
          console.error("Failed to retrieve election ID:", err);
        }
      }

      // Log the created election with ID
      console.log("Election created with data:", {
        id: election.id,
        name: title,
        blockchain_address: electionAddress,
        start_time: new Date(startTime),
        end_time: new Date(endTime),
      });

      // Add candidates to the election on blockchain and in Directus
      await addCandidatesToElection(
        electionAddress,
        candidatesList,
        wallet,
        req,
        schema,
        election.id // Make sure this is passed correctly
      );

      res.json({
        data: {
          ...election,
        },
      });
    } catch (error) {
      console.error("Error creating election:", error);
      next(
        new ServiceUnavailableException(
          error.message || "An error occurred while creating the election"
        )
      );
    }
  });

  // Get election results
  router.get("/election/:id/results", async (req, res, next) => {
    try {
      // Create ItemsService for elections
      const schema = await getSchema();
      const ItemsService = services.ItemsService;
      const electionsService = new ItemsService("elections", {
        schema,
        accountability: req.accountability,
      });

      const election = await electionsService.readOne(req.params.id);

      if (!election.blockchain_address) {
        throw new Error("Election has no blockchain address");
      }

      // Connect to specific election contract
      const electionContract = new ethers.Contract(
        election.blockchain_address,
        Election.abi,
        provider
      );

      // Get results from blockchain
      const candidatesCount = await electionContract.candidatesCount();
      const results = [];

      for (let i = 1; i <= candidatesCount; i++) {
        const candidate = await electionContract.getCandidate(i);
        results.push({
          id: candidate[0].toString(), // Access by array index instead of property name
          name: candidate[1],
          information: candidate[2],
          voteCount: candidate[3].toString(),
        });
      }

      res.json({ data: results });
    } catch (error) {
      console.error("Error fetching election results:", error);
      next(
        new ServiceUnavailableException(
          error.message || "An error occurred while fetching election results"
        )
      );
    }
  });

  // Replace the vote section in the /vote endpoint

  // Vote endpoint
  router.post("/vote", async (req, res, next) => {
    try {
      const { electionId, candidateId, voterAddress, signature, message } =
        req.body;

      console.log("Received vote request:", {
        electionId,
        candidateId,
        voterAddress: voterAddress.toLowerCase(),
        messageLength: message?.length || 0,
      });

      // Validate inputs
      if (
        !electionId ||
        !candidateId ||
        !voterAddress ||
        !signature ||
        !message
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for voting",
        });
      }

      // Signature verification
      const isValidSignature = verifySignature(
        voterAddress,
        signature,
        message
      );
      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          message: `Invalid signature. Expected signer: ${voterAddress.toLowerCase()}`,
        });
      }

      // Create ItemsService for elections and candidates
      const schema = await getSchema();
      const ItemsService = services.ItemsService;
      const electionsService = new ItemsService("elections", {
        schema,
        accountability: req.accountability,
      });
      const candidatesService = new ItemsService("candidates", {
        schema,
        accountability: req.accountability,
      });

      // Get election from database
      const election = await electionsService.readOne(electionId);
      if (!election.blockchain_address) {
        return res.status(400).json({
          success: false,
          message: "Election has no blockchain address",
        });
      }

      // Find the candidate in the database to get its blockchain ID
      const candidate = await candidatesService.readOne(candidateId);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }

      // Connect to election contract
      const electionContract = new ethers.Contract(
        election.blockchain_address,
        Election.abi,
        provider
      );

      // Since this is a server endpoint, we need to use the admin wallet
      const wallet = new ethers.Wallet(
        process.env.ADMIN_PRIVATE_KEY || "",
        provider
      );
      const connectedContract = electionContract.connect(wallet);

      // IMPORTANT: Check if the VOTER has already voted
      try {
        // Check if the user has already voted using the hasUserVoted function
        const hasVoted = await connectedContract.hasUserVoted(voterAddress);
        console.log(`Checking if ${voterAddress} has voted: ${hasVoted}`);

        if (hasVoted) {
          return res.status(400).json({
            success: false,
            message: "You have already voted in this election.",
            error: "ALREADY_VOTED",
          });
        }
      } catch (checkError) {
        console.error("Error checking if user has voted:", checkError);
        // Let's try with the direct mapping if hasUserVoted fails
        try {
          const hasVoted = await electionContract.hasVoted(voterAddress);
          if (hasVoted) {
            return res.status(400).json({
              success: false,
              message: "You have already voted in this election.",
              error: "ALREADY_VOTED",
            });
          }
        } catch (mappingError) {
          console.warn("Could not check if user already voted:", mappingError);
          // Continue with the vote attempt anyway
        }
      }

      // Get all candidates from blockchain to find the matching one
      const candidatesCount = await connectedContract.candidatesCount();
      console.log(`Found ${candidatesCount} candidates on blockchain`);

      // Find candidate ID on blockchain by matching the name
      let blockchainCandidateId = 0;
      for (let i = 1; i <= candidatesCount; i++) {
        const blockchainCandidate = await connectedContract.getCandidate(i);
        console.log(`Candidate ${i}: ${blockchainCandidate[1]}`);

        if (blockchainCandidate[1] === candidate.name) {
          blockchainCandidateId = i;
          console.log(
            `Found matching candidate: ${candidate.name} with blockchain ID: ${blockchainCandidateId}`
          );
          break;
        }
      }

      if (blockchainCandidateId === 0) {
        return res.status(400).json({
          success: false,
          message: "Could not find matching candidate on blockchain",
        });
      }

      // TEMPORARY WORKAROUND: Use the regular vote function since voteFor doesn't exist yet
      // Note: Since we're using the admin wallet, this will mark the admin as having voted
      console.log(
        `Casting vote for blockchain candidate ID ${blockchainCandidateId} (${candidate.name}) from voter ${voterAddress}`
      );

      try {
        // Use the standard vote function instead of voteFor
        const tx = await connectedContract.voteFor(
          blockchainCandidateId,
          voterAddress
        );
        console.log("Vote transaction submitted:", tx.hash);
        const receipt = await tx.wait();
        console.log(
          "Vote transaction confirmed in block:",
          receipt.blockNumber
        );

        // Record the vote in Directus
        const votersService = new ItemsService("voters", {
          schema,
          accountability: req.accountability,
        });

        try {
          // Find the voter record
          const voters = await votersService.readByQuery({
            filter: {
              _and: [
                {
                  voter_user: {
                    ethereum_address: { _eq: voterAddress.toLowerCase() },
                  },
                },
                { election: { _eq: electionId } },
              ],
            },
          });

          if (voters && voters.length > 0) {
            // Update the existing voter record
            await votersService.updateOne(voters[0].id, {
              voted: true,
              selected_candidates: candidateId,
            });
            console.log(`Updated voter record ${voters[0].id}`);
          } else {
            console.warn("No matching voter record found to update");
          }
        } catch (dbError) {
          console.error("Error updating voter record in Directus:", dbError);
        }

        return res.json({
          success: true,
          message: "Vote recorded successfully",
          transaction: tx.hash,
        });
      } catch (voteError) {
        console.error("Vote error details:", voteError);

        // Check for "already voted" error messages
        if (
          voteError.message &&
          (voteError.message.includes("already voted") ||
            voteError.reason === "You have already voted")
        ) {
          return res.status(400).json({
            success: false,
            message: "You have already voted in this election.",
            error: "ALREADY_VOTED",
          });
        }

        // Handle generic errors with specific message from blockchain if available
        return res.status(500).json({
          success: false,
          message:
            voteError.reason || voteError.message || "Failed to record vote",
          error: "VOTE_FAILED",
        });
      }
    } catch (error) {
      console.error("Error in vote endpoint:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An unexpected error occurred",
      });
    }
  });
  // Add this full endpoint implementation

  // Update election timing endpoint
  router.patch("/election/:id/timing", async (req, res, next) => {
    try {
      const { startTime, endTime } = req.body;

      // Validate the request
      if (!startTime || !endTime) {
        throw new Error("Both startTime and endTime are required");
      }

      // Make sure the user is authenticated
      if (!req.accountability || !req.accountability.user) {
        throw new Error("Authentication required");
      }

      // Create ItemsService for elections
      const schema = await getSchema();
      const ItemsService = services.ItemsService;
      const electionsService = new ItemsService("elections", {
        schema,
        accountability: req.accountability,
      });

      // Get election from database
      const election = await electionsService.readOne(req.params.id);
      if (!election || !election.blockchain_address) {
        throw new Error("Election not found or has no blockchain address");
      }

      // Format timestamps for blockchain (seconds since epoch)
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      console.log("Updating election timing to:", {
        electionId: req.params.id,
        contractAddress: election.blockchain_address,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        startTimestamp,
        endTimestamp,
      });

      // Connect to provider
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "http://localhost:8545"
      );

      // Set up admin wallet from environment
      if (!process.env.ADMIN_PRIVATE_KEY) {
        throw new Error("Admin private key not configured");
      }

      const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
      console.log("Using wallet address:", wallet.address);

      // Load Election ABI
      const electionAbi = Election.abi;

      // Connect to election contract with admin wallet
      const electionContract = new ethers.Contract(
        election.blockchain_address,
        electionAbi,
        wallet
      );

      // Update blockchain times
      console.log("Updating election times on blockchain...");
      try {
        const tx = await electionContract.updateElectionTimes(
          startTimestamp,
          endTimestamp
        );

        console.log("Submitted timing update transaction:", tx.hash);
        const receipt = await tx.wait();
        console.log("Timing update confirmed in block:", receipt.blockNumber);
      } catch (err) {
        console.error("Blockchain error:", err);
        throw new Error(
          `Failed to update election timing on blockchain: ${err.reason || err.message}`
        );
      }

      // Update database with new times
      console.log("Updating election times in database...");
      await electionsService.updateOne(req.params.id, {
        start_time: new Date(startTime),
        end_time: new Date(endTime),
      });

      console.log("Election timing updated successfully");

      res.json({
        data: {
          success: true,
          message: "Election timing updated in both database and blockchain",
          id: req.params.id,
          blockchain_address: election.blockchain_address,
          start_time: new Date(startTime),
          end_time: new Date(endTime),
        },
      });
    } catch (error) {
      console.error("Error updating election timing:", error);
      next(
        new ServiceUnavailableException(
          error.message ||
            "An error occurred while updating the election timing"
        )
      );
    }
  });

  // Helper functions - updated for ethers v6
  function extractElectionAddressFromLogs(receipt) {
    // In ethers v6, you need to use the logs from the receipt
    try {
      const log = receipt.logs.find((log) => {
        try {
          const parsedLog = factoryContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsedLog?.name === "ElectionCreated";
        } catch {
          return false;
        }
      });

      if (log) {
        const parsed = factoryContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        return parsed.args[0]; // First argument is the election address
      }

      throw new Error("ElectionCreated event not found in transaction logs");
    } catch (error) {
      console.error("Error extracting election address:", error);
      throw new Error(
        "Could not extract election address from logs: " + error.message
      );
    }
  }

  // Fix the addCandidatesToElection function

  // Replace the addCandidatesToElection function with this improved version:

  async function addCandidatesToElection(
    electionAddress,
    candidatesList,
    wallet,
    req,
    schema,
    electionId
  ) {
    // Connect to election contract
    const electionContract = new ethers.Contract(
      electionAddress,
      Election.abi,
      wallet
    );

    // Add candidates to Directus
    const ItemsService = services.ItemsService;
    const candidatesService = new ItemsService("candidates", {
      schema,
      accountability: req.accountability,
    });

    console.log(
      `Adding ${candidatesList.length} candidates to election ${electionId || "(undefined id)"}`
    );

    // Make sure we have a valid election ID
    if (!electionId) {
      console.error(
        "Election ID is undefined! Attempting to fetch it from database using contract address."
      );
      try {
        // Try to find the election by blockchain address
        const electionsService = new ItemsService("elections", {
          schema,
          accountability: req.accountability,
        });

        const elections = await electionsService.readByQuery({
          filter: {
            blockchain_address: {
              _eq: electionAddress,
            },
          },
          limit: 1,
        });

        if (elections && elections.length > 0) {
          electionId = elections[0].id;
          console.log(
            `Found election ID ${electionId} for contract ${electionAddress}`
          );
        } else {
          throw new Error(
            "Could not find election with address " + electionAddress
          );
        }
      } catch (error) {
        console.error("Failed to resolve election ID:", error);
        throw new Error("Cannot add candidates: Election ID is undefined");
      }
    }

    // Add candidates with sequential transactions
    for (let i = 0; i < candidatesList.length; i++) {
      const candidate = candidatesList[i];
      console.log(
        `Processing candidate ${i + 1}/${candidatesList.length}: ${candidate.name}`
      );

      try {
        // Add candidate to blockchain with proper nonce management
        console.log(`Adding candidate ${candidate.name} to blockchain...`);

        // Get current nonce before each transaction to avoid nonce errors
        const currentNonce = await provider.getTransactionCount(
          wallet.address,
          "pending"
        );
        console.log(
          `Using nonce ${currentNonce} for candidate ${candidate.name}`
        );

        // Create and send transaction with explicit nonce
        const tx = await electionContract.addCandidate(
          candidate.name,
          candidate.description || "",
          { nonce: currentNonce }
        );

        console.log(`Transaction sent with hash ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(
          `Added candidate ${candidate.name} to blockchain (block: ${receipt.blockNumber})`
        );

        // Create candidate in Directus database
        const directusCandidate = {
          name: candidate.name,
          description: candidate.description || "",
          election: electionId, // Now properly set
          img: candidate.img || null,
          email: candidate.email || null,
        };

        console.log(`Creating Directus candidate with data:`, {
          ...directusCandidate,
          election: electionId, // Log the ID to confirm it's present
        });

        try {
          // Add candidate to Directus with explicit election ID
          const createdCandidate =
            await candidatesService.createOne(directusCandidate);
          console.log(
            `Created Directus candidate with ID: ${createdCandidate?.id || "undefined"}`
          );
        } catch (dbError) {
          console.error(
            `Database error creating candidate ${candidate.name}:`,
            dbError
          );
          // Continue with other candidates even if database insertion fails
        }

        // Add a small delay between transactions to ensure proper nonce sequencing
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error adding candidate "${candidate.name}":`, error);

        // If it's a nonce error, wait a bit and try to continue with next candidate
        if (
          error.code === "NONCE_EXPIRED" ||
          error.message?.includes("nonce")
        ) {
          console.log("Nonce issue detected, waiting before continuing...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        // Continue with other candidates even if one fails
      }
    }

    console.log(`Finished processing ${candidatesList.length} candidates`);
  }

  function verifySignature(address, signature, message) {
    try {
      console.log("Verifying signature for:", {
        address,
        message,
        signature: signature.slice(0, 20) + "...", // Don't log full signature for security
      });

      // Normalize addresses for comparison (ethers v6)
      const signerAddress = ethers.verifyMessage(message, signature);
      const normalizedInput = address.toLowerCase();
      const normalizedSigner = signerAddress.toLowerCase();

      console.log("Signature verification:", {
        providedAddress: normalizedInput,
        recoveredAddress: normalizedSigner,
        match: normalizedSigner === normalizedInput,
      });

      return normalizedSigner === normalizedInput;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }
});
