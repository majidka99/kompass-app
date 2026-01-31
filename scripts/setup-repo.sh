#!/bin/bash

# =============================================================================
# KOMPASS-APP: Repository Setup Script
# =============================================================================
# Sets up git remotes and configuration for contributing to kompass-app
# Usage: ./setup-repo.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header "KOMPASS-APP Repository Setup"

# Change to repo root if we're in scripts folder
if [[ "$(basename $(pwd))" == "scripts" ]]; then
    cd ..
fi

# Check if we're in kompass-app repository
REPO_NAME=$(basename $(git rev-parse --show-toplevel) 2>/dev/null || echo "unknown")
if [ "$REPO_NAME" != "kompass-app" ]; then
    print_error "This script should be run in the kompass-app repository!"
    exit 1
fi

# Check current remotes
print_header "Current Git Remotes"
git remote -v

# Check if upstream is configured
if ! git remote get-url upstream > /dev/null 2>&1; then
    print_warning "Upstream remote not configured"
    echo "Setting up upstream remote to Pahnini/kompass-app..."
    git remote add upstream https://github.com/Pahnini/kompass-app.git
    print_success "Upstream remote added"
else
    UPSTREAM_URL=$(git remote get-url upstream)
    if [[ "$UPSTREAM_URL" != *"Pahnini/kompass-app"* ]]; then
        print_warning "Upstream points to: $UPSTREAM_URL"
        echo "Should point to Pahnini/kompass-app"
        echo "Fixing upstream URL..."
        git remote set-url upstream https://github.com/Pahnini/kompass-app.git
        print_success "Upstream URL corrected"
    else
        print_success "Upstream correctly configured"
    fi
fi

# Check if origin is your fork
ORIGIN_URL=$(git remote get-url origin)
print_success "Origin: $ORIGIN_URL"

# Fetch all remotes
print_header "Fetching All Remotes"
git fetch --all

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_success "Current branch: $CURRENT_BRANCH"

# Set up main branch tracking
print_header "Setting Up Branch Tracking"
if git show-ref --verify --quiet refs/heads/main; then
    echo "Setting main branch to track upstream/main..."
    git branch --set-upstream-to=upstream/main main
    print_success "Main branch tracking configured"
else
    print_warning "Local main branch not found"
fi

# Install GitHub CLI if not present (optional)
print_header "GitHub CLI Check"
if command -v gh &> /dev/null; then
    print_success "GitHub CLI is installed"
    echo "You can use automated PR creation with sync-to-main.sh"
else
    print_warning "GitHub CLI not found"
    echo "To install GitHub CLI for automated PR creation:"
    echo "  Ubuntu/Debian: sudo apt install gh"
    echo "  Fedora: sudo dnf install gh"
    echo "  Arch: sudo pacman -S github-cli"
    echo "  Or visit: https://cli.github.com/"
fi

# Show available scripts
print_header "Available Sync Scripts"
echo "📄 scripts/sync-to-main.sh   - Full featured sync with PR creation"
echo "🚀 scripts/quick-sync.sh     - Quick sync for experienced users"
echo
echo "Usage examples:"
echo "  cd scripts && ./sync-to-main.sh                    # Sync current branch"
echo "  cd scripts && ./sync-to-main.sh feature-branch     # Sync specific branch"
echo "  cd scripts && ./quick-sync.sh                      # Quick sync current branch"

print_header "Setup Complete!"
print_success "Repository is ready for syncing to main repo"
echo
echo "Next steps:"
echo "1. Make your changes and commit them"
echo "2. Push to your fork: git push origin <branch-name>"
echo "3. Run: cd scripts && ./sync-to-main.sh to sync with main repository"
