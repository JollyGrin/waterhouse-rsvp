#!/bin/bash

# Set script to exit immediately if any command fails
set -e

# Define paths - relative from client folder
DB_FOLDER="../db"
PRISMA_CLIENT_PATH="node_modules/@prisma/client"
TARGET_PATH="node_modules"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Copying Prisma client from database module to client...${NC}"

# Check if source Prisma client exists
if [ ! -d "${DB_FOLDER}/${PRISMA_CLIENT_PATH}" ]; then
  echo -e "${RED}Error: Prisma client not found in ${DB_FOLDER}/${PRISMA_CLIENT_PATH}${NC}"
  echo -e "${YELLOW}Generating Prisma client in ${DB_FOLDER}...${NC}"
  
  # Navigate to db folder and generate prisma client
  cd ${DB_FOLDER}
  npx prisma generate
  cd - # Return to previous directory
fi

# Ensure target directory exists
mkdir -p "${TARGET_PATH}"

# Check if @prisma/client package is installed in the client
if [ ! -d "${TARGET_PATH}/@prisma" ]; then
  echo -e "${YELLOW}Installing @prisma/client...${NC}"
  npm install @prisma/client
fi

# Copy the entire @prisma directory
echo -e "${YELLOW}Copying Prisma client files...${NC}"
cp -R "${DB_FOLDER}/node_modules/@prisma" "${TARGET_PATH}/"

echo -e "${GREEN}Successfully copied Prisma client!${NC}"
