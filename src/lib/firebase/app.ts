'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

import { firebaseEnv } from '../constants/env';

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
