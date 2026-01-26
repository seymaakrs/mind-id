const fs = require("fs");
const path = require("path");

/**
 * Prebuild script to create service account JSON files from environment variables.
 * This allows us to avoid passing large private keys as Lambda env vars (4KB limit).
 */

function createServiceAccountFile(filename, config) {
  const { projectId, clientEmail, privateKey } = config;

  if (!projectId || !clientEmail || !privateKey) {
    console.log(`[Prebuild] Skipping ${filename} - missing required env vars`);
    return false;
  }

  // Parse private key - handle escaped newlines
  let parsedKey = privateKey;
  if (parsedKey.startsWith('"') || parsedKey.startsWith("'")) {
    parsedKey = parsedKey.slice(1, -1);
  }
  parsedKey = parsedKey.replace(/\\n/g, "\n");

  const serviceAccount = {
    type: "service_account",
    project_id: projectId,
    private_key: parsedKey,
    client_email: clientEmail,
  };

  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, JSON.stringify(serviceAccount, null, 2));
  console.log(`[Prebuild] Created ${filename}`);
  return true;
}

// Firebase service account
createServiceAccountFile("serviceAccount.json", {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
});

// GCP AI service account (for Gemini, Veo)
createServiceAccountFile("gcp-service-account.json", {
  projectId: process.env.GCP_AI_PROJECT_ID,
  clientEmail: process.env.GCP_AI_CLIENT_EMAIL,
  privateKey: process.env.GCP_AI_PRIVATE_KEY,
});

console.log("[Prebuild] Done");
