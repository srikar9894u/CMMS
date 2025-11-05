import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import assetRoutes from './routes/assets.routes';
import workOrderRoutes from './routes/workorders.routes';
import preventiveRoutes from './routes/preventive.routes';
import inventoryRoutes from './routes/inventory.routes';
import dashboardRoutes from './routes/dashboard.routes';
import leaveRoutes from './routes/leave.routes';
import opcRoutes from './routes/opc.routes';
import s7Routes from './routes/s7.routes';
import systemRoutes from './routes/system.routes';
import uploadsRoutes from './routes/uploads.routes';
import documentsRoutes from './routes/documents.routes';
import tripFeedbackRoutes from './routes/trip-feedback.routes';
import pmSchedulerRoutes from './routes/pm-scheduler.routes';
import notificationsRoutes from './routes/notifications.routes';
import attachmentsRoutes from './routes/attachments.routes';

// Import services
import { PMSchedulerService } from './services/pm-scheduler.service';
import pmReminderSchedulerService from './services/pm-reminder-scheduler.service';

// Load environment variables
dotenv.config();

// Initialize database
initDatabase();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin image loading
}));
app.use(cors({
  origin: [
    'http://localhost:5173', // Development
    'http://localhost',      // Production (frontend on port 80)
    'http://localhost:80'
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded documents and images)
const uploadsPath = process.env.NODE_ENV === 'production'
  ? '/data/uploads'
  : path.join(__dirname, '../uploads');

// Add CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/preventive-maintenance', preventiveRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/opc', opcRoutes);
app.use('/api/s7', s7Routes);
app.use('/api/system', systemRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/trip-feedback', tripFeedbackRoutes);
app.use('/api/pm-scheduler', pmSchedulerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/attachments', attachmentsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`CMMS Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start PM Scheduler
  PMSchedulerService.startScheduler();
  console.log('PM Auto-Scheduler initialized');

  // Start PM Reminder Scheduler
  pmReminderSchedulerService.startScheduler();
  console.log('PM Reminder Scheduler initialized');
});

export default app;
