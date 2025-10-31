# GitHub Security Setup Guide

This document provides instructions for setting up and configuring GitHub security features for the CMMS project.

## Table of Contents

1. [Automated Security Workflows](#automated-security-workflows)
2. [GitHub Security Features Setup](#github-security-features-setup)
3. [Dependabot Configuration](#dependabot-configuration)
4. [Security Advisories](#security-advisories)
5. [Branch Protection Rules](#branch-protection-rules)
6. [Security Best Practices](#security-best-practices)

---

## Automated Security Workflows

The following GitHub Actions workflows have been configured for automated security scanning:

### 1. Security Scan (`security-scan.yml`)
- **Triggers**: Push, PR, Weekly schedule (Mondays at 9 AM)
- **Scans**:
  - NPM audit for backend and frontend
  - Python Safety check for OPC service
  - Secret scanning with TruffleHog
  - Trivy filesystem vulnerability scanning
- **Output**: SARIF results uploaded to GitHub Security tab

### 2. CodeQL Analysis (`codeql-analysis.yml`)
- **Triggers**: Push, PR, Weekly schedule (Wednesdays at 3 AM)
- **Languages**: JavaScript, TypeScript, Python
- **Queries**: Security-extended and quality queries
- **Output**: Code scanning alerts in Security tab

### 3. Dependency Review (`dependency-review.yml`)
- **Triggers**: Pull requests only
- **Checks**:
  - New dependency vulnerabilities
  - Outdated packages
  - License compliance
  - Problematic licenses (GPL-3.0, AGPL-3.0)
- **Output**: PR comments with findings

### 4. Docker Security (`docker-security.yml`)
- **Triggers**: Push to Dockerfiles, Weekly schedule (Sundays at 2 AM)
- **Scans**:
  - Trivy image scanning for all containers
  - Hadolint Dockerfile linting
  - Docker Compose validation
  - Security best practices check
- **Output**: SARIF results per container

### 5. SBOM Generation (`sbom-generation.yml`)
- **Triggers**: Push to main/master, Releases
- **Generates**:
  - Complete SBOM in SPDX format
  - Per-component SBOMs in CycloneDX format
- **Output**: Downloadable artifacts

---

## GitHub Security Features Setup

### Enable GitHub Advanced Security (For Private Repos)

1. Go to **Settings** → **Code security and analysis**
2. Enable the following features:

#### Dependency Graph
- Already enabled by default
- Shows all dependencies and their versions

#### Dependabot Alerts
- Click **Enable** next to "Dependabot alerts"
- Automatically detects vulnerable dependencies
- Creates alerts in the Security tab

#### Dependabot Security Updates
- Click **Enable** next to "Dependabot security updates"
- Automatically creates PRs to update vulnerable dependencies
- Uses the `.github/dependabot.yml` configuration

#### Code Scanning (CodeQL)
- Click **Set up** next to "Code scanning"
- Select **Default** or use the configured workflow
- Our custom workflow is already in `.github/workflows/codeql-analysis.yml`

#### Secret Scanning
- Click **Enable** next to "Secret scanning"
- Detects accidentally committed secrets
- GitHub scans for tokens, API keys, etc.

#### Secret Scanning Push Protection
- Click **Enable** next to "Push protection"
- Blocks pushes that contain secrets
- Prevents accidental secret exposure

---

## Dependabot Configuration

Dependabot is configured via `.github/dependabot.yml`:

### Current Configuration:
- **Backend (npm)**: Weekly updates on Mondays
- **Frontend (npm)**: Weekly updates on Mondays
- **OPC Service (pip)**: Weekly updates on Mondays
- **Docker**: Weekly updates on Tuesdays
- **GitHub Actions**: Monthly updates

### Grouped Updates:
- Patch updates are grouped into single PRs
- Security updates are separate for visibility

### Customization:
Edit `.github/dependabot.yml` to:
- Change update frequency
- Modify grouping strategy
- Add ignore rules for specific dependencies
- Change PR limits

---

## Security Advisories

### Creating a Security Advisory

1. Go to **Security** tab → **Advisories**
2. Click **New draft security advisory**
3. Fill in the details:
   - **Title**: Brief description
   - **CVE ID**: Request or assign later
   - **Severity**: Critical/High/Medium/Low
   - **CWE**: Common Weakness Enumeration
   - **Description**: Detailed explanation
   - **Affected versions**: Version ranges
   - **Patched versions**: Fixed versions

4. **Collaborate**:
   - Add collaborators to work on fix privately
   - Use temporary private fork for fixes
   - Test patches before public disclosure

5. **Publish**:
   - When fix is ready and deployed
   - Publishes to GitHub Advisory Database
   - Triggers Dependabot alerts for users

### Receiving Security Reports

Users can report vulnerabilities via:
1. **Private Security Advisory** (Recommended)
   - Users click "Report a vulnerability" in Security tab
   - Creates private communication channel
   - Allows collaboration before disclosure

2. **Email**: Srikar.Tanukula@zabeelfeed.ae
   - For users not familiar with GitHub
   - Manually create advisory after triage

3. **Public Issues** (Discouraged)
   - Only for low-severity issues
   - Use issue template: `.github/ISSUE_TEMPLATE/security_vulnerability.yml`

---

## Branch Protection Rules

### Recommended Settings for Main Branch

1. Go to **Settings** → **Branches**
2. Click **Add rule** for `main` or `master`
3. Configure the following:

#### Required Status Checks
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date
- **Select checks**:
  - Security Scan / npm-audit
  - Security Scan / python-safety
  - Security Scan / secret-scan
  - CodeQL / Analyze
  - Docker Security / scan-backend
  - Docker Security / scan-frontend
  - Docker Security / scan-opc-service

#### Pull Request Requirements
- ✅ Require a pull request before merging
- **Required approvals**: 1 (for team environments)
- ✅ Dismiss stale pull request approvals
- ✅ Require review from Code Owners (if CODEOWNERS file exists)

#### Additional Settings
- ✅ Require conversation resolution before merging
- ✅ Require signed commits (optional but recommended)
- ✅ Include administrators (enforce rules on admins too)

---

## Security Best Practices

### For Developers

1. **Never Commit Secrets**
   - Use `.env` files (in `.gitignore`)
   - Use GitHub Secrets for CI/CD
   - Use environment variables in production

2. **Review Dependabot PRs Promptly**
   - Security updates should be merged ASAP
   - Test in staging before production
   - Check release notes for breaking changes

3. **Monitor Security Alerts**
   - Check Security tab regularly
   - Enable email notifications
   - Triage and fix vulnerabilities by severity

4. **Code Review for Security**
   - Review authentication/authorization logic
   - Check input validation
   - Verify SQL queries use parameterization
   - Look for hardcoded credentials

5. **Keep Dependencies Updated**
   - Merge Dependabot PRs regularly
   - Don't let dependencies get too outdated
   - Review security advisories for used packages

### For Administrators

1. **Enable All Security Features**
   - Follow setup instructions above
   - Enable branch protection
   - Configure required status checks

2. **Regular Security Audits**
   - Review Security Overview monthly
   - Check for unresolved vulnerabilities
   - Audit access permissions

3. **Incident Response Plan**
   - Document security contact
   - Define escalation procedures
   - Plan disclosure timeline

4. **Monitor Workflow Runs**
   - Check Actions tab for failures
   - Investigate security scan failures
   - Fix issues promptly

5. **Educate Team Members**
   - Share security best practices
   - Conduct security training
   - Promote security-first culture

---

## Notification Configuration

### Email Notifications

1. Go to **Settings** → **Notifications** (your personal settings)
2. Under **Dependabot alerts**:
   - ✅ Email notifications for vulnerabilities

3. Under **Security alerts**:
   - ✅ Email for new vulnerabilities
   - ✅ Email for security advisories

### Slack Integration (Optional)

1. Install GitHub app in Slack workspace
2. Subscribe to repository: `/github subscribe srikar9894u/CMMS`
3. Configure alerts: `/github subscribe srikar9894u/CMMS security`

---

## Troubleshooting

### Workflow Failures

**Issue**: Security scan workflow fails
- **Check**: Review workflow logs in Actions tab
- **Fix**: Update workflow syntax or dependencies
- **Test**: Use `workflow_dispatch` to manually trigger

**Issue**: CodeQL analysis timeout
- **Check**: Repository size and complexity
- **Fix**: Adjust timeout in workflow or exclude large files
- **Alternative**: Use incremental analysis

### False Positives

**Issue**: Dependabot flags non-exploitable vulnerability
- **Action**: Research the CVE details
- **Option 1**: Update dependency if possible
- **Option 2**: Add to ignore list in `dependabot.yml`
- **Document**: Add comment explaining why ignored

### Missing Alerts

**Issue**: Known vulnerability not detected
- **Check**: Is Dependabot enabled?
- **Check**: Is dependency in lockfile?
- **Force**: Regenerate lockfile with `npm ci` or `pip install`
- **Manual**: Check GitHub Advisory Database

---

## Additional Resources

- [GitHub Security Documentation](https://docs.github.com/en/code-security)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Last Updated**: October 2025
**Maintained By**: CMMS Security Team
