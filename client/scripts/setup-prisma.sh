#!/bin/bash

# Set script to exit immediately if any command fails
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Prisma for SvelteKit app...${NC}"

# Define paths - relative from client folder
DB_FOLDER="../db"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# 1. Ensure .env file exists (copy from example if not)
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Creating .env file from example...${NC}"
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  else
    echo -e "${YELLOW}Creating .env file from db folder...${NC}"
    # Try to copy from db folder if local example doesn't exist
    if [ -f "${DB_FOLDER}/.env" ]; then
      cp "${DB_FOLDER}/.env" "$ENV_FILE"
    else
      echo -e "${RED}No .env template found. Creating default...${NC}"
      echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/waterhouse?schema=public\"" > "$ENV_FILE"
    fi
  fi
  echo -e "${GREEN}Created .env file. You may need to update the database connection string.${NC}"
fi

# 2. Check if the schema is up to date
echo -e "${YELLOW}Checking if Prisma schema is up to date...${NC}"
if [ -f "${DB_FOLDER}/prisma/schema.prisma" ]; then
  # Compare schemas - if different, update client schema
  if ! cmp -s "prisma/schema.prisma" "${DB_FOLDER}/prisma/schema.prisma"; then
    echo -e "${YELLOW}Updating Prisma schema from db folder...${NC}"
    cp "${DB_FOLDER}/prisma/schema.prisma" "prisma/schema.prisma"
  else
    echo -e "${GREEN}Prisma schema is up to date.${NC}"
  fi
else
  echo -e "${YELLOW}No schema found in db folder. Using existing schema.${NC}"
fi

# 3. Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# 4. Verify installation
if [ -d "node_modules/.prisma" ]; then
  echo -e "${GREEN}Prisma client generated successfully!${NC}"
else
  echo -e "${RED}Failed to generate Prisma client. Please check for errors above.${NC}"
  exit 1
fi

echo -e "${GREEN}Prisma setup complete!${NC}"
