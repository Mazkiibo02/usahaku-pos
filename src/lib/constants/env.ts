const requiredFirebaseEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

type FirebaseEnvKey = (typeof requiredFirebaseEnvKeys)[number];

const missingKeys = requiredFirebaseEnvKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingKeys.join(", ")}`
  );
}

function getEnvValue(key: FirebaseEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const firebaseEnv = {
  apiKey: getEnvValue("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnvValue("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvValue("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvValue("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvValue("NEXT_PUBLIC_FIREBASE_APP_ID"),
} as const;