# Security Tools Setup and Configuration

This document provides detailed instructions for setting up and using all security tools configured for the CMMS project.

## Table of Contents

1. [GitHub-Integrated Security Tools](#github-integrated-security-tools)
2. [Local Security Tools](#local-security-tools)
3. [Pre-commit Hooks](#pre-commit-hooks)
4. [Third-Party Security Services](#third-party-security-services)
5. [Security Tool Configuration](#security-tool-configuration)
6. [Running Security Scans Manually](#running-security-scans-manually)

---

## GitHub-Integrated Security Tools

### 1. Dependabot
**Purpose**: Automated dependency vulnerability scanning and updates

**Configuration**: `.github/dependabot.yml`

**Features**:
- Weekly scans for npm (backend, frontend), pip (OPC service), and Docker
- Automatic PR creation for security updates
- Grouped patch updates

**How to Use**:
- Enable in: Repository Settings → Security & Analysis → Dependabot alerts
- PRs will be created automatically
- Review and merge security updates promptly

### 2. CodeQL
**Purpose**: Semantic code analysis for security vulnerabilities

**Configuration**: `.github/workflows/codeql-analysis.yml`

**Languages**: JavaScript, TypeScript, Python

**Schedule**:
- On every push and PR
- Weekly scan on Wednesdays at 3 AM UTC

**View Results**: Security tab → Code scanning alerts

### 3. Secret Scanning
**Purpose**: Detect accidentally committed secrets

**Setup**:
1. Go to Settings → Security & Analysis
2. Enable "Secret scanning"
3. Enable "Push protection" (blocks commits with secrets)

**Supported Secrets**:
- GitHub tokens
- AWS credentials
- API keys
- Private keys
- Database credentials

### 4. Dependency Review
**Purpose**: Review new dependencies in PRs for vulnerabilities

**Configuration**: `.github/workflows/dependency-review.yml`

**Features**:
- Blocks PRs with moderate+ vulnerabilities
- License compliance checking
- Comments on PRs with findings

---

## Local Security Tools

### 1. Pre-commit Hooks
**Installation**:
```bash
# Install pre-commit
pip install pre-commit

# Install hooks in repository
cd /path/to/CMMS
pre-commit install
pre-commit install --hook-type commit-msg

# Run manually on all files
pre-commit run --all-files
```

**Configuration**: `.pre-commit-config.yaml`

**Checks Performed**:
- Secret detection (detect-secrets, git-secrets)
- Python security (Bandit)
- Code quality (Black, isort, flake8)
- Dockerfile linting (Hadolint)
- ESLint with security rules
- YAML/JSON validation
- Large file detection
- Private key detection

### 2. ESLint Security Plugin
**Purpose**: Detect security issues in JavaScript/TypeScript code

**Configuration**: `.eslintrc.security.json`

**Installation** (per project):
```bash
# Backend
cd backend
npm install --save-dev eslint eslint-plugin-security eslint-plugin-no-secrets @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Frontend
cd frontend
npm install --save-dev eslint eslint-plugin-security eslint-plugin-no-secrets @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

**Run**:
```bash
# Copy security config
cp ../.eslintrc.security.json .eslintrc.json

# Run ESLint
npm run lint  # or
npx eslint . --ext .ts,.tsx,.js,.jsx
```

**Detects**:
- Unsafe regular expressions
- SQL injection patterns
- Command injection
- Hardcoded secrets
- eval() usage
- Timing attacks

### 3. Bandit (Python)
**Purpose**: Security linting for Python code

**Configuration**: `opc-service/.bandit`

**Installation**:
```bash
pip install bandit[sarif]
```

**Run**:
```bash
cd opc-service
bandit -r . -f json -o bandit-report.json --config .bandit
bandit -r . -f sarif -o bandit-report.sarif --config .bandit
```

**Detects**:
- SQL injection
- Shell injection
- Hardcoded passwords
- Weak cryptography
- Unsafe deserialization
- Debug mode in production

### 4. Safety (Python)
**Purpose**: Check Python dependencies for known vulnerabilities

**Installation**:
```bash
pip install safety
```

**Run**:
```bash
cd opc-service
safety check --json
safety check --file requirements.txt
```

### 5. npm audit
**Purpose**: Check npm dependencies for vulnerabilities

**Run**:
```bash
# Backend
cd backend
npm audit
npm audit fix  # Auto-fix vulnerabilities
npm audit fix --force  # Force major version updates

# Frontend
cd frontend
npm audit
npm audit fix
```

### 6. Trivy (Container Scanning)
**Purpose**: Scan Docker images for vulnerabilities

**Installation**:
```bash
# Linux
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy

# macOS
brew install aquasecurity/trivy/trivy

# Windows (using Chocolatey)
choco install trivy
```

**Run**:
```bash
# Build images first
docker-compose build

# Scan individual images
trivy image cmms-backend
trivy image cmms-frontend
trivy image cmms-opc-service

# Scan with severity filter
trivy image --severity HIGH,CRITICAL cmms-backend

# Generate SARIF report
trivy image --format sarif --output backend-trivy.sarif cmms-backend
```

---

## Third-Party Security Services

### 1. Snyk
**Purpose**: Comprehensive vulnerability scanning for code, dependencies, and containers

**Setup**:
1. Sign up at [snyk.io](https://snyk.io)
2. Get your API token from Account Settings
3. Add to GitHub: Settings → Secrets → New repository secret
   - Name: `SNYK_TOKEN`
   - Value: Your Snyk API token

**Configuration**: `.github/workflows/snyk-security.yml`

**Features**:
- Dependency vulnerability scanning
- Container image scanning
- Infrastructure as Code scanning
- License compliance
- Automatic fix PRs

**Run Locally**:
```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test backend
cd backend
snyk test

# Test and monitor
snyk monitor

# Test Docker image
docker build -t cmms-backend .
snyk container test cmms-backend
```

### 2. Semgrep
**Purpose**: Static analysis for finding bugs and security issues

**Configuration**: `.github/workflows/semgrep.yml`

**Features**:
- Pattern-based code scanning
- Custom rule creation
- Auto-remediation suggestions
- CI/CD integration

**Run Locally**:
```bash
# Install
pip install semgrep

# Run with auto config (recommended rules)
semgrep scan --config=auto

# Run with specific rulesets
semgrep scan --config=p/security-audit
semgrep scan --config=p/owasp-top-ten
semgrep scan --config=p/cwe-top-25

# Generate SARIF output
semgrep scan --config=auto --sarif --output=semgrep.sarif
```

### 3. SonarQube/SonarCloud (Optional)
**Purpose**: Continuous code quality and security analysis

**Setup**:
1. Sign up at [sonarcloud.io](https://sonarcloud.io)
2. Import your GitHub repository
3. Add SonarCloud GitHub Action (see SonarCloud setup wizard)

**Features**:
- Code smells detection
- Security hotspots
- Code coverage analysis
- Technical debt tracking
- Quality gates

---

## Security Tool Configuration

### Environment Variables

Create a `.env.security` file (DO NOT COMMIT):
```bash
# Snyk
SNYK_TOKEN=your_snyk_token_here

# SonarCloud (if using)
SONAR_TOKEN=your_sonar_token_here

# GitHub (for API access)
GITHUB_TOKEN=your_github_token_here
```

### GitHub Secrets Configuration

Required secrets for full functionality:
1. `SNYK_TOKEN` - For Snyk scanning
2. `SONAR_TOKEN` - For SonarCloud (optional)

Add at: Repository Settings → Secrets and variables → Actions → New repository secret

---

## Running Security Scans Manually

### Full Security Audit

Run all security checks locally:

```bash
#!/bin/bash
# save as: run-security-audit.sh

echo "🔒 Running Full Security Audit..."

# 1. Pre-commit hooks
echo "1️⃣ Running pre-commit hooks..."
pre-commit run --all-files

# 2. npm audit
echo "2️⃣ Running npm audit..."
cd backend && npm audit && cd ..
cd frontend && npm audit && cd ..

# 3. Python safety check
echo "3️⃣ Running Python safety check..."
cd opc-service
pip install safety
safety check
cd ..

# 4. Bandit
echo "4️⃣ Running Bandit..."
cd opc-service
pip install bandit
bandit -r . --config .bandit
cd ..

# 5. ESLint security
echo "5️⃣ Running ESLint security scan..."
cd backend
npm install --save-dev eslint-plugin-security
npx eslint . --ext .ts,.js
cd ../frontend
npm install --save-dev eslint-plugin-security
npx eslint . --ext .ts,.tsx,.js,.jsx
cd ..

# 6. Trivy scans
echo "6️⃣ Running Trivy container scans..."
docker-compose build
trivy image --severity HIGH,CRITICAL cmms-backend
trivy image --severity HIGH,CRITICAL cmms-frontend
trivy image --severity HIGH,CRITICAL cmms-opc-service

# 7. Semgrep
echo "7️⃣ Running Semgrep..."
pip install semgrep
semgrep scan --config=auto

# 8. Snyk (if token available)
if [ ! -z "$SNYK_TOKEN" ]; then
  echo "8️⃣ Running Snyk..."
  npm install -g snyk
  snyk auth $SNYK_TOKEN
  cd backend && snyk test && cd ..
  cd frontend && snyk test && cd ..
else
  echo "8️⃣ Skipping Snyk (no token)"
fi

echo "✅ Security audit complete!"
```

Make it executable:
```bash
chmod +x run-security-audit.sh
./run-security-audit.sh
```

### Quick Security Check

For fast checks before committing:

```bash
# Check for secrets
pre-commit run detect-secrets --all-files

# Check for hardcoded credentials
grep -r "password\s*=\s*['\"]" --include="*.ts" --include="*.js" --include="*.py" .

# Quick npm audit
cd backend && npm audit --audit-level=moderate
cd frontend && npm audit --audit-level=moderate

# Quick Python check
cd opc-service && safety check --json
```

---

## Security Scanning Schedule

### Automated Scans

| Tool | Frequency | Day/Time | Trigger |
|------|-----------|----------|---------|
| Security Scan (npm, safety, secrets) | Weekly | Monday 9 AM UTC | Push, PR, Schedule |
| CodeQL | Weekly | Wednesday 3 AM UTC | Push, PR, Schedule |
| Docker Security | Weekly | Sunday 2 AM UTC | Push, PR, Schedule |
| Semgrep | Weekly | Tuesday 10 AM UTC | Push, PR, Schedule |
| Snyk | Weekly | Thursday 11 AM UTC | Push, PR, Schedule |
| Dependency Review | On PR | - | Pull Requests |
| Linting Security | On Push | - | Push, PR |

### Manual Triggers

All workflows can be triggered manually:
1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Select branch and run

---

## Interpreting Security Scan Results

### Severity Levels

- **Critical**: Fix immediately (within 24 hours)
  - Remote code execution
  - Authentication bypass
  - SQL injection

- **High**: Fix within 1 week
  - Cross-site scripting (XSS)
  - Privilege escalation
  - Data exposure

- **Medium**: Fix within 30 days
  - CSRF vulnerabilities
  - Information disclosure
  - Weak cryptography

- **Low**: Fix in next sprint
  - Code quality issues
  - Minor security improvements

### SARIF Reports

SARIF (Static Analysis Results Interchange Format) reports are uploaded to GitHub Security tab:
- View at: Security → Code scanning
- Filter by severity, tool, category
- Dismiss false positives with justification
- Track remediation progress

---

## Best Practices

### 1. Developer Workflow

```bash
# Before starting work
git pull
pre-commit install

# Before committing
pre-commit run --all-files
npm audit
git commit -m "your message"

# Before creating PR
./run-security-audit.sh
git push
```

### 2. Reviewing Security Alerts

1. **Triage**: Assess severity and impact
2. **Research**: Read CVE details, check exploitability
3. **Fix**: Update dependency or patch code
4. **Test**: Ensure fix doesn't break functionality
5. **Document**: Note why dismissed if false positive

### 3. Keeping Tools Updated

```bash
# Update pre-commit hooks
pre-commit autoupdate

# Update security tools
pip install --upgrade safety bandit semgrep

# Update npm security packages
npm update eslint-plugin-security
```

---

## Troubleshooting

### Pre-commit hook failures

**Issue**: Hook fails on first run
```bash
# Solution: Install all dependencies
pre-commit install-hooks
```

**Issue**: Python hooks fail
```bash
# Solution: Ensure correct Python version
python --version  # Should be 3.11+
pip install pre-commit
```

### False Positives

**ESLint security warnings**:
```javascript
// Disable specific rules with justification
// eslint-disable-next-line security/detect-object-injection -- Using validated input
const value = obj[key];
```

**Bandit warnings**:
```python
# nosec B404 - subprocess used for PLC communication only
import subprocess
```

### Workflow Failures

**Check logs**:
1. Go to Actions tab
2. Click failed workflow
3. Expand failed job
4. Review error messages

**Common issues**:
- Missing secrets (SNYK_TOKEN)
- Dependency installation failures
- Network timeouts

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Snyk Learn](https://learn.snyk.io/)
- [Semgrep Rules](https://semgrep.dev/explore)
- [Bandit Documentation](https://bandit.readthedocs.io/)

---

**Last Updated**: October 2025
**Maintained By**: CMMS Security Team
**Contact**: srikar.989@gmail.com
