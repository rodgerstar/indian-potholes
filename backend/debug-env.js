#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
  'CLOUDFLARE_WORKER_URL',
  'RECAPTCHA_SECRET_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL'
];

const missingVars = [];
const presentVars = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    presentVars.push(varName);
  } else {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  process.exit(1);
}

// Test MongoDB connection
try {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.disconnect();
} catch (error) {
  process.exit(1);
}

// Test R2 configuration
try {
  const { validateR2Config, s3Client } = await import('./config/r2.js');
  
  if (!validateR2Config()) {
    process.exit(1);
  }
  
  // Test R2 connectivity
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME,
    MaxKeys: 1
  });
  
  await s3Client.send(listCommand);
} catch (error) {
  process.exit(1);
} 