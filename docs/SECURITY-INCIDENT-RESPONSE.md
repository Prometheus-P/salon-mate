# Security Incident Response: Git History Cleanup

## Overview

This document provides procedures for removing sensitive data from Git history when critical security issues are discovered (e.g., accidentally committed secrets, API keys, credentials).

> **WARNING**: These procedures rewrite Git history. All team members must re-clone the repository after cleanup.

---

## Quick Reference

| Scenario | Tool | Difficulty |
|----------|------|------------|
| Single file removal | `git filter-repo` | Easy |
| Multiple files | `git filter-repo` | Medium |
| Pattern-based removal | `git filter-repo` | Medium |
| Complex cleanup | BFG Repo-Cleaner | Easy |
| GitHub cache invalidation | GitHub Support | Required |

---

## Prerequisites

### Install Required Tools

```bash
# git-filter-repo (recommended)
brew install git-filter-repo

# BFG Repo-Cleaner (alternative)
brew install bfg
```

---

## Procedure 1: Remove Specific File from History

### Step 1: Backup Repository

```bash
# Create a complete backup before any changes
cp -r salon-mate salon-mate-backup-$(date +%Y%m%d)
```

### Step 2: Remove File Using git-filter-repo

```bash
# Navigate to repository
cd salon-mate

# Remove a specific file from all history
git filter-repo --path <path/to/sensitive-file> --invert-paths

# Examples:
git filter-repo --path .env --invert-paths
git filter-repo --path src/backend/.env --invert-paths
git filter-repo --path credentials.json --invert-paths
```

### Step 3: Force Push to Remote

```bash
# Force push all branches
git push origin --force --all
git push origin --force --tags
```

---

## Procedure 2: Remove Files by Pattern

### Remove Multiple File Types

```bash
# Remove all .env files
git filter-repo --path-glob '*.env' --invert-paths

# Remove all files matching pattern
git filter-repo --path-regex '.*\.key$' --invert-paths
git filter-repo --path-regex '.*credentials.*\.json$' --invert-paths
```

---

## Procedure 3: Using BFG Repo-Cleaner (Alternative)

BFG is faster and simpler for common cases:

```bash
# Clone a fresh copy
git clone --mirror git@github.com:Prometheus-P/salon-mate.git

# Remove specific file from history
bfg --delete-files .env salon-mate.git

# Remove files by pattern
bfg --delete-files '*.pem' salon-mate.git

# Remove files containing secrets
bfg --replace-text passwords.txt salon-mate.git

# Cleanup and push
cd salon-mate.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push
```

---

## Procedure 4: Replace Sensitive Text

If secrets are embedded in code rather than separate files:

### Create replacement file

```bash
# passwords.txt - each line is replaced with ***REMOVED***
echo "sk-abc123secretkey" >> passwords.txt
echo "ghp_xxxGitHubToken" >> passwords.txt
echo "API_KEY=secret123" >> passwords.txt
```

### Run replacement

```bash
bfg --replace-text passwords.txt salon-mate.git
```

---

## Post-Cleanup Actions (CRITICAL)

### 1. Invalidate GitHub Cache

GitHub caches commit data. Contact GitHub Support to purge:

1. Go to https://support.github.com/
2. Select "Security" category
3. Request cache invalidation for the repository
4. Provide commit SHAs containing sensitive data

### 2. Rotate Compromised Credentials

**Immediately rotate ALL exposed credentials:**

- [ ] Database passwords
- [ ] API keys (Google, Kakao, etc.)
- [ ] OAuth client secrets
- [ ] JWT secret keys
- [ ] AWS/GCP service account keys
- [ ] Redis passwords

### 3. Notify Team

```markdown
## SECURITY NOTICE: Repository History Rewritten

The repository history has been rewritten to remove sensitive data.

**Action Required:**
1. Delete your local clone
2. Re-clone the repository: `git clone git@github.com:Prometheus-P/salon-mate.git`
3. DO NOT push from old clones

**Timeline:** Complete by [DATE]
```

### 4. Update Forks (if applicable)

- Notify fork owners to delete and re-fork
- Old forks may still contain sensitive data

### 5. Check GitHub Actions Cache

```bash
# Clear GitHub Actions cache
gh cache delete --all
```

---

## Verification Checklist

After cleanup, verify the sensitive data is removed:

```bash
# Search for sensitive patterns in history
git log --all -p | grep -i "password\|secret\|api.key" | head -50

# Verify specific file is gone
git log --all -- path/to/file

# Check all branches
for branch in $(git branch -r); do
    echo "Checking $branch..."
    git log $branch --oneline -- path/to/file
done
```

---

## Prevention Measures

### 1. Pre-commit Hooks

Install git-secrets or similar:

```bash
# Install git-secrets
brew install git-secrets

# Configure for AWS patterns
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add 'api_key\s*=\s*.+'
```

### 2. CI/CD Secret Scanning

GitHub provides automatic secret scanning for public repositories. For private repos:

```yaml
# .github/workflows/security.yml
name: Secret Scan
on: [push, pull_request]
jobs:
  trufflehog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

### 3. Environment Variable Management

- Never commit `.env` files
- Use `.env.example` with placeholder values
- Use secrets management (GitHub Secrets, HashiCorp Vault)

---

## Emergency Contacts

| Role | Contact | Response Time |
|------|---------|---------------|
| GitHub Support | https://support.github.com/ | 24-48 hours |
| Security Team Lead | [Internal] | Immediate |

---

## References

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

*Last Updated: 2025-12-03*
