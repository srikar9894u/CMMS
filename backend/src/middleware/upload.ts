import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists - use /data/uploads for persistence
const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/data/uploads'
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and SVG images are allowed.'));
  }
};

// File filter for documents (PDFs, Excel, Word, CAD, Images, etc.)
const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    // CAD files
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'image/vnd.dwg',
    'image/vnd.dxf',
    'application/dxf',
    // Other
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
                            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.tiff',
                            '.dwg', '.dxf', '.txt', '.zip', '.rar'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, Word, Excel, Images, CAD files, and common archives.'));
  }
};

// Configure multer for images
export const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Configure multer for documents (larger size limit)
export const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size for documents
  }
});

export default uploadImage;
