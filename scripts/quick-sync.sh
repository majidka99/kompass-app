#!/bin/bash

# =============================================================================
# KOMPASS-APP: Quick Sync Script
# =============================================================================
# Quick and simple version for immediate syncing
# Usage: ./quick-sync.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Sync to Main Repository${NC}"

# Change to repo root if we're in scripts folder
if [[ "$(basename $(pwd))" == "scripts" ]]; then
    cd ..
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"

# Fetch and rebase
echo -e "${BLUE}📥 Fetching updates...${NC}"
git fetch upstream
git fetch origin

echo -e "${BLUE}🔄 Rebasing onto upstream/main...${NC}"
git rebase upstream/main

echo -e "${BLUE}📤 Pushing to your fork...${NC}"
git push origin $BRANCH --force-with-lease

# Generate PR URL
ORIGIN_URL=$(git remote get-url origin)
UPSTREAM_URL=$(git remote get-url upstream)
ORIGIN_REPO=$(echo $ORIGIN_URL | sed -E 's/.*[:/]([^/]+\/[^/]+)\.git$/\1/')
UPSTREAM_REPO=$(echo $UPSTREAM_URL | sed -E 's/.*[:/]([^/]+\/[^/]+)\.git$/\1/')
PR_URL="https://github.com/$UPSTREAM_REPO/compare/main...$ORIGIN_REPO:$BRANCH"

echo -e "${GREEN}✅ Done! Create PR: $PR_URL${NC}"
