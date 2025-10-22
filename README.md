# CMMS - Computerized Maintenance Management System

A modern, full-stack CMMS web application designed for local LAN deployment. Manage assets, work orders, preventive maintenance schedules, and inventory with an intuitive, responsive interface.

## Features

- **Asset Management**: Track equipment, machinery, and facilities with detailed information
- **Work Order Management**: Create, assign, and track maintenance work orders
- **Preventive Maintenance**: Schedule and manage recurring maintenance tasks
- **Inventory Management**: Track parts, supplies, and monitor stock levels
- **User Management**: Role-based access control (Admin, Manager, Technician, Viewer)
- **Dashboard**: Real-time metrics and insights
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- SQLite (lightweight, file-based database)
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18
- TypeScript
- Vite (fast build tool)
- Tailwind CSS (modern styling)
- React Router (navigation)
- Axios (HTTP client)

## Quick Start with Docker (Recommended for LAN)

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB RAM available
- Network access to the host machine

### Deployment Steps

1. **Clone or download this repository**

2. **Configure environment variables** (optional)
   ```bash
   # Edit docker-compose.yml to change JWT_SECRET and other settings
   # For production, change JWT_SECRET to a secure random string
   ```

3. **Build and start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Open your web browser
   - Navigate to: `http://<your-server-ip>`
   - Default login:
     - Username: `admin`
     - Password: `admin123`

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Accessing from Other Devices on LAN

1. Find your server's IP address:
   ```bash
   # On Linux/Mac:
   ip addr show
   # or
   ifconfig

   # On Windows:
   ipconfig
   ```

2. From any device on the same network, open a browser and go to:
   ```
   http://<server-ip-address>
   ```

3. Make sure your firewall allows traffic on port 80

## Manual Installation (Development)

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Start the backend:
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:3000

### Frontend Setup

1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

### Building for Production

1. Build backend:
   ```bash
   cd backend
   npm run build
   ```

2. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

## Default User Accounts

On first run, the system creates a default admin account:

- **Username**: admin
- **Password**: admin123

**IMPORTANT**: Change the default password immediately after first login!

## User Roles

- **Admin**: Full system access, can manage users
- **Manager**: Can manage assets, work orders, PM schedules, and inventory
- **Technician**: Can view and update work orders, view assets and inventory
- **Viewer**: Read-only access to all modules

## Database

The application uses SQLite, a file-based database stored at:
- Development: `backend/database.sqlite`
- Docker: `./data/database.sqlite` (persisted in volume)

To backup your data, simply copy the database file.

## Configuration

### Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend server port | 3000 |
| NODE_ENV | Environment mode | development |
| JWT_SECRET | Secret key for JWT tokens | (change in production) |
| DB_PATH | Path to SQLite database | ./database.sqlite |
| CORS_ORIGIN | Allowed frontend origin | http://localhost:5173 |

### Docker Configuration

Edit `docker-compose.yml` to customize:
- Port mappings
- Environment variables
- Volume mounts
- Network settings

## Network Configuration for LAN Access

### Port Configuration
By default, the application uses:
- Port 80 (HTTP) for web access
- Port 3000 (internal) for backend API

### Firewall Rules

**Linux (UFW):**
```bash
sudo ufw allow 80/tcp
```

**Windows Firewall:**
```powershell
New-NetFirewallRule -DisplayName "CMMS Web" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

**macOS:**
```bash
# Firewall rules typically not needed on macOS for LAN access
```

### Static IP (Recommended)

For reliable LAN access, configure a static IP on your server:

**Linux (Ubuntu/Debian):**
Edit `/etc/netplan/01-netcfg.yaml`:
```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

Apply changes:
```bash
sudo netplan apply
```

## Troubleshooting

### Cannot access from other devices
- Verify firewall allows port 80
- Check if backend is running: `docker ps`
- Ensure devices are on the same network
- Try accessing using IP address, not hostname

### Database errors
- Check file permissions on data directory
- Ensure SQLite file is not corrupted
- Restore from backup if needed

### Login issues
- Clear browser cache and cookies
- Check browser console for errors
- Verify backend is running: `curl http://localhost:3000/health`

### Docker issues
- Check logs: `docker-compose logs`
- Restart services: `docker-compose restart`
- Rebuild: `docker-compose up -d --build`

## API Documentation

The backend API is RESTful and follows these endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Assets
- `GET /api/assets` - List all assets
- `GET /api/assets/:id` - Get asset details
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Work Orders
- `GET /api/work-orders` - List all work orders
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create new work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

### Preventive Maintenance
- `GET /api/preventive-maintenance` - List PM schedules
- `GET /api/preventive-maintenance/:id` - Get PM schedule
- `POST /api/preventive-maintenance` - Create PM schedule
- `PUT /api/preventive-maintenance/:id` - Update PM schedule
- `POST /api/preventive-maintenance/:id/complete` - Mark PM task complete

### Inventory
- `GET /api/inventory` - List inventory items
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:id` - Get inventory item
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `POST /api/inventory/:id/adjust` - Adjust quantity

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Security Considerations

1. **Change default credentials** immediately
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** for production deployments
4. **Regular backups** of the database
5. **Keep dependencies updated**: `npm audit fix`
6. **Restrict network access** to trusted devices only
7. **Use strong passwords** for all user accounts

## Backup and Restore

### Backup
```bash
# Copy the SQLite database
cp data/database.sqlite data/database-backup-$(date +%Y%m%d).sqlite

# Or create a tar archive
tar -czf cmms-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore
```bash
# Stop the application
docker-compose down

# Restore the database
cp data/database-backup-YYYYMMDD.sqlite data/database.sqlite

# Restart the application
docker-compose up -d
```

## Performance Optimization

For better performance on LAN:
- Use wired Ethernet instead of WiFi
- Place server on a gigabit network
- Consider SSD storage for database
- Allocate sufficient RAM (minimum 2GB)

## Future Enhancements

Potential features for future versions:
- File attachments for work orders
- Mobile app (React Native)
- Email notifications
- Advanced reporting and analytics
- Barcode/QR code scanning
- Multi-site support
- Integration with IoT sensors

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoints and examples

## License

MIT License - Free to use and modify for your organization.

## Credits

Built with modern web technologies:
- React, TypeScript, Node.js, Express
- Tailwind CSS for styling
- SQLite for data persistence
- Docker for easy deployment

---

**Version**: 1.0.0
**Last Updated**: 2025
