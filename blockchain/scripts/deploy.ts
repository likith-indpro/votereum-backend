import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ElectionFactory
  const ElectionFactory = await ethers.getContractFactory("ElectionFactory");
  const electionFactory = await ElectionFactory.deploy();
  await electionFactory.waitForDeployment();

  const electionFactoryAddress = await electionFactory.getAddress();
  console.log("ElectionFactory deployed to:", electionFactoryAddress);

  // Save contract ABI and address for frontend integration
  const artifactsDir = path.join(__dirname, "../artifacts");
  const contractsDir = path.join(__dirname, "../contracts");

  // Create the output directory if it doesn't exist
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  // Save ElectionFactory contract info
  const ElectionFactoryArtifact = require(
    path.join(
      artifactsDir,
      "contracts/ElectionFactory.sol/ElectionFactory.json"
    )
  );

  fs.writeFileSync(
    path.join(deploymentDir, "ElectionFactory.json"),
    JSON.stringify(
      {
        address: electionFactoryAddress,
        abi: ElectionFactoryArtifact.abi,
      },
      null,
      2
    )
  );

  // Save Election contract ABI for future use
  const ElectionArtifact = require(
    path.join(artifactsDir, "contracts/Election.sol/Election.json")
  );

  fs.writeFileSync(
    path.join(deploymentDir, "Election.json"),
    JSON.stringify(
      {
        abi: ElectionArtifact.abi,
      },
      null,
      2
    )
  );

  console.log("Contract deployment data saved to:", deploymentDir);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
