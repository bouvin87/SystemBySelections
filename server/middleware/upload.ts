import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directories if they don't exist
const deviationsDir = path.join(process.cwd(), 'uploads', 'deviations');
const kanbanDir = path.join(process.cwd(), 'uploads', 'kanban');

if (!fs.existsSync(deviationsDir)) {
  fs.mkdirSync(deviationsDir, { recursive: true });
}
if (!fs.existsSync(kanbanDir)) {
  fs.mkdirSync(kanbanDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on request path
    const uploadsDir = req.path.includes('kanban') ? kanbanDir : deviationsDir;
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images and PDFs
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Endast bilder (JPEG, PNG, GIF, WebP) och PDF-filer är tillåtna'));
  }
};

// Configure upload limits
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Middleware for single file upload
export const uploadSingle = upload.single('file');

// Middleware for multiple file upload
export const uploadMultiple = upload.array('files', 5);