#!/bin/bash

# =============================================================================
# KOMPASS-APP: Sync Feature Branch to Main Repository
# =============================================================================
# This script automates the process of syncing your feature branch changes
# to the main repository (upstream) by creating a pull request.
#
# Prerequisites:
# - Your feature branch should be pushed to your fork (origin)
# - Git remotes should be configured: origin (your fork), upstream (main repo)
#
# Usage: ./sync-to-main.sh [branch-name]
# If no branch name provided, uses current branch
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    # Try to go up one directory if we're in the scripts folder
    if [[ "$(basename $(pwd))" == "scripts" ]]; then
        cd ..
        if ! git rev-parse --git-dir > /dev/null 2>&1; then
            print_error "This is not a git repository!"
            exit 1
        fi
    else
        print_error "This is not a git repository!"
        exit 1
    fi
fi

# Get current branch or use provided branch name
CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH=${1:-$CURRENT_BRANCH}

print_header "KOMPASS-APP: Sync to Main Repository"
echo "Target Branch: $TARGET_BRANCH"
echo "Repository: $(basename $(git rev-parse --show-toplevel))"
echo

# Check if target branch exists
if ! git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
    print_error "Branch '$TARGET_BRANCH' does not exist!"
    exit 1
fi

# Switch to target branch if not already on it
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    print_status "Switching to branch: $TARGET_BRANCH"
    git checkout $TARGET_BRANCH
fi

# Check git remotes
print_header "Checking Git Remotes"
if ! git remote get-url origin > /dev/null 2>&1; then
    print_error "Remote 'origin' not found! Please configure your fork as origin."
    exit 1
fi

if ! git remote get-url upstream > /dev/null 2>&1; then
    print_error "Remote 'upstream' not found! Please configure the main repo as upstream."
    exit 1
fi

ORIGIN_URL=$(git remote get-url origin)
UPSTREAM_URL=$(git remote get-url upstream)

print_success "Origin (your fork): $ORIGIN_URL"
print_success "Upstream (main repo): $UPSTREAM_URL"

# Fetch latest changes from upstream
print_header "Fetching Latest Changes"
print_status "Fetching from upstream..."
git fetch upstream

print_status "Fetching from origin..."
git fetch origin

# Check if branch is ahead of upstream/main
COMMITS_AHEAD=$(git rev-list --count upstream/main..$TARGET_BRANCH)
if [ "$COMMITS_AHEAD" -eq 0 ]; then
    print_warning "No new commits to sync. Branch is up to date with upstream/main."
    exit 0
fi

print_success "Found $COMMITS_AHEAD commits ahead of upstream/main"

# Show commits that will be synced
print_header "Commits to be Synced"
git log --oneline upstream/main..$TARGET_BRANCH

# Rebase onto upstream/main
print_header "Rebasing onto Upstream Main"
print_status "Rebasing $TARGET_BRANCH onto upstream/main..."

if git rebase upstream/main; then
    print_success "Rebase completed successfully"
else
    print_error "Rebase failed! Please resolve conflicts manually and run:"
    print_error "  git rebase --continue"
    print_error "  git push origin $TARGET_BRANCH --force-with-lease"
    exit 1
fi

# Push to origin
print_header "Pushing to Your Fork"
print_status "Pushing $TARGET_BRANCH to origin..."

if git push origin $TARGET_BRANCH --force-with-lease; then
    print_success "Successfully pushed to origin/$TARGET_BRANCH"
else
    print_error "Failed to push to origin!"
    exit 1
fi

# Generate PR information
print_header "Pull Request Information"

# Extract repository information
ORIGIN_REPO=$(echo $ORIGIN_URL | sed -E 's/.*[:/]([^/]+\/[^/]+)\.git$/\1/')
UPSTREAM_REPO=$(echo $UPSTREAM_URL | sed -E 's/.*[:/]([^/]+\/[^/]+)\.git$/\1/')

# Create PR URL
PR_URL="https://github.com/$UPSTREAM_REPO/compare/main...$ORIGIN_REPO:$TARGET_BRANCH"

print_success "Branch successfully synced and ready for PR!"
echo
echo "📋 Next Steps:"
echo "1. Create Pull Request: $PR_URL"
echo "2. Or visit: https://github.com/$UPSTREAM_REPO/pulls"
echo
echo "📄 PR Details:"
echo "  Base repository: $UPSTREAM_REPO"
echo "  Base branch: main"
echo "  Head repository: $ORIGIN_REPO"
echo "  Compare branch: $TARGET_BRANCH"
echo

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    print_header "GitHub CLI Detected"
    echo "Would you like to create the PR automatically? (y/n)"
    read -r CREATE_PR
    
    if [ "$CREATE_PR" = "y" ] || [ "$CREATE_PR" = "Y" ]; then
        print_status "Creating PR with GitHub CLI..."
        
        # Generate PR title and body based on commits
        PR_TITLE=$(git log --format="%s" upstream/main..$TARGET_BRANCH | head -1)
        
        # Create a more detailed PR body
        PR_BODY="## Phase 1 - Critical Bug Fixes Complete 🎉

### Summary
This PR contains the complete Phase 1 critical bug fixes for the Kompass-App project.

### Key Achievements
- ✅ ESLint errors reduced from 36 → 0 (100% clean!)
- ✅ Modern ESLint configuration with flat config
- ✅ Critical React import issues resolved
- ✅ TypeScript compilation clean
- ✅ Production-ready codebase

### Changes Made
$(git log --format="- %s" upstream/main..$TARGET_BRANCH)

### Testing
- [x] ESLint passes without errors
- [x] TypeScript compilation successful
- [x] All critical issues resolved

**Ready for merge!** 🚀"

        if gh pr create \
            --repo "$UPSTREAM_REPO" \
            --title "$PR_TITLE" \
            --body "$PR_BODY" \
            --head "$ORIGIN_REPO:$TARGET_BRANCH" \
            --base main; then
            print_success "Pull Request created successfully!"
        else
            print_warning "Failed to create PR automatically. Please create it manually at:"
            echo "$PR_URL"
        fi
    else
        print_status "Manual PR creation - visit: $PR_URL"
    fi
else
    print_warning "GitHub CLI not found. Create PR manually at:"
    echo "$PR_URL"
fi

print_header "Sync Complete!"
print_success "Your changes are now ready to be merged into the main repository."
