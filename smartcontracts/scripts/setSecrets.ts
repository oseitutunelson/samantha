import { SecretsManager } from "@chainlink/functions-toolkit";
import { ethers } from "ethers";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = process.env.AMOY_RPC_URL!;
  const privateKey = process.env.AMOY_PRIVATE_KEY!;
  const pinataJwt = process.env.PINATA_JWT!;
  const donId = "fun-polygon-amoy-1"; // Polygon Amoy DON

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // ✅ Step 1: Define your secrets
  const secrets = {
    API_KEY: "d752945a57514a439d2fa74e8b2db2ae",
  };

  // ✅ Step 2: Initialize the secrets manager
  const secretsManager = new SecretsManager({
    signer: wallet,
    functionsRouterAddress: "0xC22a79eBA640940ABB6dF0f7982cc119578E11De",
    donId,
  });

  // ✅ Step 3: Initialize (must be called before encrypt)
  await secretsManager.initialize();

  // ✅ Step 4: Encrypt the secrets
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  // ✅ Step 5: Upload encrypted secrets to IPFS (Pinata)
  const ipfsRes = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    encryptedSecretsObj,
    {
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
        "Content-Type": "application/json",
      },
    }
  );

  const ipfsHash = ipfsRes.data.IpfsHash;
  console.log("✅ Secrets uploaded to IPFS!");
  console.log(`🔗 IPFS URL: https://ipfs.io/ipfs/${ipfsHash}`);
}

main().catch(console.error);
