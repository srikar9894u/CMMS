#!/bin/bash

# CMMS Security Audit Script
# This script runs all local security checks
# Usage: ./run-security-audit.sh [--quick|--full]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Check mode
MODE="${1:---full}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CMMS Security Audit Script          ║${NC}"
echo -e "${BLUE}║   Mode: ${MODE}                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Helper functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

run_check() {
    local name=$1
    local command=$2
    local required=${3:-true}

    print_info "Running: $name"

    if eval "$command" > /dev/null 2>&1; then
        print_success "$name passed"
        return 0
    else
        if [ "$required" = true ]; then
            print_error "$name failed"
            return 1
        else
            print_warning "$name failed (optional)"
            return 0
        fi
    fi
}

# Check if running in project root
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the CMMS project root directory"
    exit 1
fi

# 1. Pre-commit hooks check
if [ "$MODE" != "--quick" ]; then
    print_header "1. Pre-commit Hooks"

    if command -v pre-commit &> /dev/null; then
        print_info "Running pre-commit hooks..."
        if pre-commit run --all-files; then
            print_success "Pre-commit hooks passed"
        else
            print_error "Pre-commit hooks found issues"
        fi
    else
        print_warning "Pre-commit not installed. Install with: pip install pre-commit"
    fi
fi

# 2. NPM Audit - Backend
print_header "2. NPM Audit - Backend"

if [ -f "backend/package.json" ]; then
    cd backend
    print_info "Installing backend dependencies..."
    npm ci --quiet

    print_info "Running npm audit..."
    if npm audit --audit-level=moderate; then
        print_success "Backend npm audit passed"
    else
        print_error "Backend has npm vulnerabilities"
        print_info "Run 'cd backend && npm audit fix' to attempt auto-fix"
    fi
    cd ..
else
    print_warning "Backend package.json not found"
fi

# 3. NPM Audit - Frontend
print_header "3. NPM Audit - Frontend"

if [ -f "frontend/package.json" ]; then
    cd frontend
    print_info "Installing frontend dependencies..."
    npm ci --quiet

    print_info "Running npm audit..."
    if npm audit --audit-level=moderate; then
        print_success "Frontend npm audit passed"
    else
        print_error "Frontend has npm vulnerabilities"
        print_info "Run 'cd frontend && npm audit fix' to attempt auto-fix"
    fi
    cd ..
else
    print_warning "Frontend package.json not found"
fi

# 4. Python Safety Check
print_header "4. Python Safety Check"

if [ -f "opc-service/requirements.txt" ]; then
    cd opc-service

    print_info "Installing safety..."
    pip install safety --quiet 2>/dev/null || print_warning "Failed to install safety"

    if command -v safety &> /dev/null; then
        print_info "Running safety check..."
        if safety check --json; then
            print_success "Python dependencies are safe"
        else
            print_error "Python has vulnerable dependencies"
        fi
    else
        print_warning "Safety not available"
    fi
    cd ..
else
    print_warning "requirements.txt not found"
fi

# 5. Bandit Python Security
if [ "$MODE" != "--quick" ]; then
    print_header "5. Bandit - Python Security Scan"

    if [ -d "opc-service" ]; then
        cd opc-service

        print_info "Installing bandit..."
        pip install bandit --quiet 2>/dev/null || print_warning "Failed to install bandit"

        if command -v bandit &> /dev/null; then
            print_info "Running bandit..."
            if [ -f ".bandit" ]; then
                if bandit -r . --config .bandit -q; then
                    print_success "Bandit scan passed"
                else
                    print_warning "Bandit found potential issues"
                fi
            else
                if bandit -r . -q; then
                    print_success "Bandit scan passed"
                else
                    print_warning "Bandit found potential issues"
                fi
            fi
        else
            print_warning "Bandit not available"
        fi
        cd ..
    fi
fi

# 6. ESLint Security - Backend
if [ "$MODE" != "--quick" ]; then
    print_header "6. ESLint Security - Backend"

    if [ -f "backend/package.json" ]; then
        cd backend

        print_info "Checking ESLint configuration..."
        if [ -f "../.eslintrc.security.json" ]; then
            cp ../.eslintrc.security.json .eslintrc.json
            print_info "Running ESLint with security rules..."
            if npx eslint . --ext .ts,.js --quiet; then
                print_success "Backend ESLint security passed"
            else
                print_warning "Backend ESLint found issues"
            fi
        else
            print_warning "ESLint security config not found"
        fi
        cd ..
    fi
fi

# 7. ESLint Security - Frontend
if [ "$MODE" != "--quick" ]; then
    print_header "7. ESLint Security - Frontend"

    if [ -f "frontend/package.json" ]; then
        cd frontend

        print_info "Checking ESLint configuration..."
        if [ -f "../.eslintrc.security.json" ]; then
            cp ../.eslintrc.security.json .eslintrc.json
            print_info "Running ESLint with security rules..."
            if npx eslint . --ext .ts,.tsx,.js,.jsx --quiet; then
                print_success "Frontend ESLint security passed"
            else
                print_warning "Frontend ESLint found issues"
            fi
        else
            print_warning "ESLint security config not found"
        fi
        cd ..
    fi
fi

# 8. Secret Detection
print_header "8. Secret Detection"

print_info "Checking for potential secrets..."

# Check for common secret patterns
SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]{8,}"
    "api[_-]?key\s*=\s*['\"][^'\"]{8,}"
    "secret\s*=\s*['\"][^'\"]{8,}"
    "token\s*=\s*['\"][^'\"]{8,}"
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -rE "$pattern" backend/src frontend/src opc-service --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null; then
        ((SECRETS_FOUND++))
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    print_success "No obvious secrets detected"
else
    print_error "Potential secrets found - review output above"
fi

# 9. Docker Security (if Docker is available)
if [ "$MODE" = "--full" ] && command -v docker &> /dev/null; then
    print_header "9. Docker Security Scan"

    if command -v trivy &> /dev/null; then
        print_info "Building Docker images..."
        docker-compose build --quiet 2>/dev/null || print_warning "Failed to build images"

        print_info "Scanning backend image..."
        if trivy image --severity HIGH,CRITICAL --quiet cmms-backend 2>/dev/null; then
            print_success "Backend image scan passed"
        else
            print_warning "Backend image has vulnerabilities"
        fi

        print_info "Scanning frontend image..."
        if trivy image --severity HIGH,CRITICAL --quiet cmms-frontend 2>/dev/null; then
            print_success "Frontend image scan passed"
        else
            print_warning "Frontend image has vulnerabilities"
        fi

        print_info "Scanning OPC service image..."
        if trivy image --severity HIGH,CRITICAL --quiet cmms-opc-service 2>/dev/null; then
            print_success "OPC service image scan passed"
        else
            print_warning "OPC service image has vulnerabilities"
        fi
    else
        print_warning "Trivy not installed - skipping container scans"
        print_info "Install trivy: https://aquasecurity.github.io/trivy/"
    fi
fi

# 10. Git Security
print_header "10. Git Security Checks"

print_info "Checking for large files..."
LARGE_FILES=$(find . -type f -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" 2>/dev/null | wc -l)
if [ "$LARGE_FILES" -eq 0 ]; then
    print_success "No large files found"
else
    print_warning "Found $LARGE_FILES large files (>1MB)"
fi

print_info "Checking for .env files in git..."
if git ls-files | grep -q "\.env$"; then
    print_error ".env files found in git! Remove them immediately"
else
    print_success "No .env files in git"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Security Audit Summary        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Passed:   $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed:   $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Security audit failed with $FAILED errors${NC}"
    echo -e "${YELLOW}Please fix the issues above before committing${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Security audit passed with $WARNINGS warnings${NC}"
    echo -e "${YELLOW}Consider addressing the warnings${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Security audit passed successfully!${NC}"
    exit 0
fi
