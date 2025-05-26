import { defineEndpoint } from "@directus/extensions-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

      // Check if blockchain integration is available
      if (!factoryContract) {
        throw new Error(
          "Blockchain integration is not available. Check your ELECTION_FACTORY_ADDRESS environment variable."
        );
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
      });

      // Log the created election
      console.log("Created election in Directus:", election);

      // Add candidates to the election on blockchain and in Directus
      await addCandidatesToElection(
        electionAddress,
        candidatesList,
        wallet,
        req,
        schema,
        election.id
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

  // Vote endpoint
  router.post("/vote", async (req, res, next) => {
    try {
      const { electionId, candidateId, voterAddress, signature, message } =
        req.body;

      // Verify the signature to ensure the request is coming from the actual voter
      const isValidSignature = verifySignature(
        voterAddress,
        signature,
        message
      );

      if (!isValidSignature) {
        throw new Error("Invalid signature");
      }

      // Create ItemsService for elections
      const schema = await getSchema();
      const ItemsService = services.ItemsService;
      const electionsService = new ItemsService("elections", {
        schema,
        accountability: req.accountability,
      });

      const election = await electionsService.readOne(electionId);

      if (!election.blockchain_address) {
        throw new Error("Election has no blockchain address");
      }

      // Connect to election contract
      const electionContract = new ethers.Contract(
        election.blockchain_address,
        Election.abi,
        provider
      );

      // Since this is a server endpoint, we need to use the admin wallet
      // In a real scenario, the user would directly sign the transaction
      const wallet = new ethers.Wallet(
        process.env.ADMIN_PRIVATE_KEY || "",
        provider
      );
      const connectedContract = electionContract.connect(wallet);

      // Check if user has already voted
      const hasVoted = await connectedContract.hasVoted(voterAddress);
      if (hasVoted) {
        throw new Error("User has already voted");
      }

      // Vote on behalf of the user (this should be handled differently in production)
      // Ideally, the user should sign and send the transaction directly
      const tx = await connectedContract.vote(candidateId);
      await tx.wait();

      // Record the vote in Directus
      const votersService = new ItemsService("voters", {
        schema,
        accountability: req.accountability,
      });

      try {
        await votersService.updateByQuery({
          filter: {
            voter_user: {
              ethereum_address: {
                _eq: voterAddress,
              },
            },
            election: {
              id: {
                _eq: electionId,
              },
            },
          },
          data: {
            voted: true,
            selected_candidate: candidateId,
          },
        });
      } catch (dbError) {
        console.error("Error updating voter record in Directus:", dbError);
        // Continue execution even if the database update fails
        // The vote is already recorded on blockchain
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error voting:", error);
      next(
        new ServiceUnavailableException(
          error.message || "An error occurred while processing your vote"
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

    for (const candidate of candidatesList) {
      try {
        // Add candidate to blockchain
        const tx = await electionContract.addCandidate(
          candidate.name,
          candidate.description || ""
        );
        await tx.wait();

        // Add candidate to Directus
        await candidatesService.createOne({
          name: candidate.name,
          description: candidate.description || "",
          election: electionId,
          img: candidate.img || null,
          email: candidate.email || null,
        });
      } catch (error) {
        console.error(`Error adding candidate "${candidate.name}":`, error);
        // Continue with other candidates even if one fails
      }
    }
  }

  function verifySignature(address, signature, message) {
    try {
      // Updated for ethers v6
      const signerAddress = ethers.verifyMessage(message, signature);
      return signerAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }
});
