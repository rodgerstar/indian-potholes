#!/usr/bin/env node

/**
 * Deployment script for Cloudflare Worker
 * This script makes it easier to deploy the worker from the backend directory
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const workerDir = path.join(__dirname, 'cloudflare-worker');

// Check if worker directory exists
if (!fs.existsSync(workerDir)) {
  process.exit(1);
}

// Check if wrangler.toml exists in worker directory
const wranglerPath = path.join(workerDir, 'wrangler.toml');
if (!fs.existsSync(wranglerPath)) {
  process.exit(1);
}

// Validate environment input to prevent command injection
const validateEnvironment = (env) => {
  const allowedEnvironments = ['development', 'staging', 'production'];
  return allowedEnvironments.includes(env) ? env : 'development';
};

try {
  // Change to worker directory
  process.chdir(workerDir);
  
  // Check if wrangler is installed globally
  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    console.log('✅ Wrangler CLI is available');
  } catch (error) {
    console.log('📦 Installing Wrangler CLI globally...');
    execSync('npm install -g wrangler', { stdio: 'inherit' });
  }
  
  // Get and validate deployment environment from command line arguments
  const rawEnvironment = process.argv[2] || 'development';
  const environment = validateEnvironment(rawEnvironment);
  
  // Log the validated environment
  console.log(`🚀 Deploying to environment: ${environment}`);
  
  // Use an allowlist approach for deployment commands to prevent injection
  const deploymentCommands = {
    'production': ['wrangler', 'deploy', '--env', 'production'],
    'staging': ['wrangler', 'deploy', '--env', 'staging'],
    'development': ['wrangler', 'deploy']
  };
  
  const commandArgs = deploymentCommands[environment];
  
  // Use spawn instead of execSync for better security
  const { spawn } = require('child_process');
  
  const deployProcess = spawn(commandArgs[0], commandArgs.slice(1), {
    stdio: 'inherit',
    shell: false // Disable shell to prevent command injection
  });
  
  deployProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Deployment completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Deployment failed');
      process.exit(1);
    }
  });
  
  deployProcess.on('error', (error) => {
    console.error('❌ Failed to start deployment process:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Deployment script error:', error.message);
  process.exit(1);
} 