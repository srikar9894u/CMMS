# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the CMMS (Computerized Maintenance Management System) project seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Go to the [Security tab](https://github.com/srikar9894u/CMMS/security/advisories)
   - Click "Report a vulnerability"
   - Fill in the details

2. **Email**
   - Send details to: [srikar.989@gmail.com]
   - Include "CMMS Security Vulnerability" in the subject line

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with assessment and expected timeline
- **Fix Timeline**: Critical issues within 30 days, others within 90 days

## Security Measures

### Current Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Admin, Manager, Technician)
   - Password hashing with bcryptjs
   - Session management

2. **API Security**
   - CORS configuration
   - Helmet.js security headers
   - Input validation with express-validator
   - Rate limiting (recommended)

3. **Database Security**
   - Parameterized queries (SQLite with better-sqlite3)
   - Prepared statements to prevent SQL injection
   - Regular backups

4. **Dependencies**
   - Automated vulnerability scanning with Dependabot
   - Regular dependency updates
   - Security workflow checks on PRs

5. **Container Security**
   - Multi-stage Docker builds
   - Non-root user execution
   - Minimal base images
   - Regular image updates

6. **OPC/S7 PLC Communication**
   - Secure connection handling
   - Certificate validation for OPC UA
   - Network isolation via Docker

### Security Best Practices for Deployment

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets (256-bit minimum)
   - Rotate secrets regularly

2. **Network Security**
   - Use HTTPS in production
   - Configure firewall rules
   - Isolate PLC networks
   - Use VPN for remote access

3. **Database**
   - Regular backups (automated)
   - Encrypted backups
   - Access control to database files

4. **Monitoring**
   - Enable application logging
   - Monitor admin logs regularly
   - Set up alerts for suspicious activity
   - Review system health dashboard

5. **Updates**
   - Apply security patches promptly
   - Test updates in staging first
   - Keep Docker images updated

## Known Security Considerations

### Industrial Control System (ICS) Environment

This system interfaces with PLCs and industrial equipment:

- **Network Segmentation**: Deploy on isolated networks
- **Read-Only Tags**: Configure critical tags as read-only
- **Change Management**: Implement approval workflows for PLC changes
- **Audit Logging**: All PLC configuration changes are logged
- **Backup**: Regular backups before making changes

### Data Protection

- User passwords are hashed and never stored in plaintext
- Work order data may contain sensitive operational information
- Document uploads should be scanned for malware
- Audit logs contain IP addresses and user actions

## Security Workflow

All pull requests are automatically scanned for:

- Known vulnerabilities in dependencies (Dependabot)
- Code quality and security issues (CodeQL)
- Secrets accidentally committed
- Docker image vulnerabilities

## Disclosure Policy

- Security vulnerabilities will be disclosed after a fix is available
- We aim to coordinate disclosure with the reporter
- Credit will be given to reporters (unless anonymity is requested)

## Security Hall of Fame

We recognize and thank security researchers who help us keep CMMS secure:

*(No reports yet)*

## Contact

For security-related questions or concerns:
- Email: srikar.989@gmail.com
- GitHub: [@srikar9894u](https://github.com/srikar9894u)

---

**Last Updated**: October 2025
