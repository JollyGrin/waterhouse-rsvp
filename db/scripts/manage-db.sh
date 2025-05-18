#!/bin/bash

# Configuration
CONTAINER_NAME="waterhouse-db"
POSTGRES_USER="username"
POSTGRES_PASSWORD="password"
POSTGRES_DB="waterhouse"
PORT="5432"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if container exists
container_exists() {
  docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
  return $?
}

# Function to check if container is running
container_running() {
  docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
  return $?
}

# Start the database
start_db() {
  if container_exists; then
    if container_running; then
      echo -e "${YELLOW}Database container is already running.${NC}"
    else
      echo -e "${YELLOW}Starting existing database container...${NC}"
      docker start ${CONTAINER_NAME}
      echo -e "${GREEN}Database container started successfully.${NC}"
    fi
  else
    echo -e "${YELLOW}Creating and starting new database container...${NC}"
    docker run --name ${CONTAINER_NAME} \
      -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
      -e POSTGRES_USER=${POSTGRES_USER} \
      -e POSTGRES_DB=${POSTGRES_DB} \
      -p ${PORT}:5432 \
      -d postgres:latest
    
    # Wait a moment to ensure container is up
    sleep 3
    
    if container_running; then
      echo -e "${GREEN}Database container created and started successfully.${NC}"
    else
      echo -e "${RED}Failed to start database container.${NC}"
      exit 1
    fi
  fi
}

# Stop the database
stop_db() {
  if container_running; then
    echo -e "${YELLOW}Stopping database container...${NC}"
    docker stop ${CONTAINER_NAME}
    echo -e "${GREEN}Database container stopped successfully.${NC}"
  else
    echo -e "${YELLOW}Database container is not running.${NC}"
  fi
}

# Restart the database
restart_db() {
  if container_exists; then
    echo -e "${YELLOW}Restarting database container...${NC}"
    stop_db
    start_db
  else
    echo -e "${YELLOW}Database container does not exist. Creating new one...${NC}"
    start_db
  fi
}

# Remove the database container
remove_db() {
  if container_exists; then
    if container_running; then
      echo -e "${YELLOW}Stopping database container first...${NC}"
      docker stop ${CONTAINER_NAME}
    fi
    echo -e "${YELLOW}Removing database container...${NC}"
    docker rm ${CONTAINER_NAME}
    echo -e "${GREEN}Database container removed successfully.${NC}"
  else
    echo -e "${YELLOW}Database container does not exist.${NC}"
  fi
}

# Show database status
status_db() {
  if container_exists; then
    if container_running; then
      echo -e "${GREEN}Database container is running.${NC}"
      echo -e "${YELLOW}Connection URL:${NC} postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${PORT}/${POSTGRES_DB}"
      echo -e "${YELLOW}Container Info:${NC}"
      docker ps --filter "name=${CONTAINER_NAME}" --format "ID: {{.ID}}, Image: {{.Image}}, Status: {{.Status}}, Ports: {{.Ports}}"
    else
      echo -e "${YELLOW}Database container exists but is not running.${NC}"
    fi
  else
    echo -e "${RED}Database container does not exist.${NC}"
  fi
}

# Main script logic
case "$1" in
  start)
    start_db
    ;;
  stop)
    stop_db
    ;;
  restart)
    restart_db
    ;;
  remove)
    remove_db
    ;;
  status)
    status_db
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|remove|status}"
    exit 1
    ;;
esac

exit 0
