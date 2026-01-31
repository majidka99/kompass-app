# 🚀 Kompass-App Sync Scripts

Automated scripts for syncing your feature branch changes to the main repository.

## 📋 Available Scripts

### 🔧 `setup-repo.sh`

**Initial repository setup and configuration**

```bash
cd scripts
./setup-repo.sh
```

- Configures git remotes (origin/upstream)
- Sets up branch tracking
- Checks GitHub CLI availability
- One-time setup for new contributors

### 🚀 `sync-to-main.sh`

**Full-featured sync with PR creation**

```bash
cd scripts
./sync-to-main.sh                    # Sync current branch
./sync-to-main.sh feature-branch     # Sync specific branch
```

**Features:**

- ✅ Fetches latest upstream changes
- ✅ Rebases your branch onto upstream/main
- ✅ Pushes to your fork with force-with-lease
- ✅ Generates PR URL and details
- ✅ Auto-creates PR with GitHub CLI (if available)
- ✅ Comprehensive error handling and status reporting

### ⚡ `quick-sync.sh`

**Quick sync for experienced users**

```bash
cd scripts
./quick-sync.sh
```

**Features:**

- 🚀 Fast execution with minimal output
- 🔄 Same sync process as full script
- 📤 Generates PR URL for manual creation

## 🔄 Typical Workflow

1. **First time setup:**

   ```bash
   cd scripts
   ./setup-repo.sh
   ```

2. **Work on your feature:**

   ```bash
   git checkout -b feature/my-awesome-feature
   # Make your changes...
   git add .
   git commit -m "feat: Add awesome feature"
   git push origin feature/my-awesome-feature
   ```

3. **Sync to main repository:**

   ```bash
   cd scripts
   ./sync-to-main.sh
   ```

4. **Create Pull Request:**
   - Automatically created with GitHub CLI
   - Or manually via the provided URL

## 📚 What the Scripts Do

### Pre-sync Checks

- ✅ Verifies git repository and remotes
- ✅ Checks if branch exists and has commits ahead
- ✅ Shows commits to be synced

### Sync Process

1. **Fetch** latest changes from upstream and origin
2. **Rebase** your branch onto upstream/main
3. **Push** to your fork with `--force-with-lease` (safe force push)
4. **Generate** PR creation URL and details

### Post-sync Actions

- 📋 Provides PR creation URL
- 🤖 Auto-creates PR with GitHub CLI (if available)
- 📊 Shows sync summary and next steps

## 🛡️ Safety Features

- **Error handling:** Scripts exit on any error
- **Conflict detection:** Alerts if rebase conflicts occur
- **Safe force push:** Uses `--force-with-lease` to prevent overwrites
- **Branch validation:** Checks branch existence before operations
- **Status reporting:** Clear colored output for all operations

## 🔧 Prerequisites

- Git repository with origin (your fork) and upstream (main repo) remotes
- Your feature branch should be pushed to origin
- GitHub CLI (optional, for auto PR creation)

## 🎯 Perfect for Phase 1 Completion

These scripts were created specifically for syncing the **Phase 1 Critical Bug Fixes** to the main repository:

- ✅ ESLint errors: 36 → 0 (100% clean!)
- ✅ Modern ESLint configuration
- ✅ React import issues resolved
- ✅ TypeScript compilation clean
- ✅ Production-ready codebase

## ⚡ Quick Start (GitHub CLI Ready)

**Now that GitHub CLI is installed and authenticated:**

1. **Sync your current Phase 1 branch:**

   ```bash
   cd scripts
   ./sync-to-main.sh
   ```

2. **The script will automatically:**
   - ✅ Fetch latest upstream changes
   - ✅ Rebase your branch
   - ✅ Push to your fork
   - ✅ **Create the Pull Request automatically**

3. **Your PR will include:**
   - 📋 Professional title from your commit
   - 📄 Detailed description of Phase 1 achievements
   - 🔗 All 4 commits with ESLint fixes (36→0!)

**That's it! Your PR will be live immediately.** 🚀

## 🆘 Troubleshooting

### Rebase Conflicts

If rebase fails:

1. Resolve conflicts manually
2. Run: `git rebase --continue`
3. Run: `git push origin <branch> --force-with-lease`

### Remote Issues

```bash
# Fix upstream remote
git remote set-url upstream https://github.com/Pahnini/kompass-app.git

# Check remotes
git remote -v
```

### GitHub CLI Installation & Setup

```bash
# Ubuntu/Debian
sudo apt install gh

# Fedora
sudo dnf install gh

# Arch Linux
sudo pacman -S github-cli
```

**After installation, authenticate with GitHub:**

```bash
# Authenticate with GitHub
gh auth login

# Follow the prompts:
# 1. Choose "GitHub.com"
# 2. Choose "HTTPS" or "SSH" (recommend SSH if you have keys set up)
# 3. Choose "Login with a web browser" (easiest)
# 4. Copy the one-time code and press Enter
# 5. Complete authentication in your browser

# Verify authentication
gh auth status
```

**Now you can use automated PR creation:**

```bash
cd scripts
./sync-to-main.sh  # Will automatically create PR with GitHub CLI
```

## 📞 Support

For issues with these scripts, check:

1. Git remote configuration: `git remote -v`
2. Branch status: `git status`
3. Upstream connectivity: `git fetch upstream`

---

**Ready to sync your amazing Phase 1 fixes! 🎉**
