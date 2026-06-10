export const firebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string,
};

if (
  !firebaseEnv.apiKey ||
  !firebaseEnv.authDomain ||
  !firebaseEnv.projectId ||
  !firebaseEnv.storageBucket ||
  !firebaseEnv.messagingSenderId ||
  !firebaseEnv.appId ||
  !firebaseEnv.recaptchaSiteKey
) {
  console.error("Missing Firebase Config:", firebaseEnv);
  throw new Error(
    "Missing required Firebase environment variables. Please check your .env.local file."
  );
}