import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  entityType: 'work_order' | 'asset' | 'inventory';
  entityId: number;
  onUploadComplete?: () => void;
  maxFiles?: number;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload = ({ entityType, entityId, onUploadComplete, maxFiles = 10 }: FileUploadProps) => {
  const { themeColors } = useTheme();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Add files to state
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setUploading(true);

    // Upload files
    try {
      const formData = new FormData();
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId.toString());

      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      await axios.post('/api/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          setFiles(prev =>
            prev.map((f, idx) =>
              idx >= prev.length - newFiles.length
                ? { ...f, progress: percentCompleted }
                : f
            )
          );
        },
      });

      // Mark all as successful
      setFiles(prev =>
        prev.map((f, idx) =>
          idx >= prev.length - newFiles.length
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );

      // Clear after delay
      setTimeout(() => {
        setFiles([]);
        if (onUploadComplete) onUploadComplete();
      }, 2000);
    } catch (error: any) {
      setFiles(prev =>
        prev.map((f, idx) =>
          idx >= prev.length - newFiles.length
            ? {
                ...f,
                status: 'error',
                error: error.response?.data?.error || 'Upload failed',
              }
            : f
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-purple-500 bg-purple-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className={`text-purple-600 font-medium`}>Drop files here...</p>
        ) : (
          <div>
            <p className={`${themeColors.colors.textPrimary} font-medium mb-2`}>
              Drag & drop files here, or click to select
            </p>
            <p className={`text-sm ${themeColors.colors.textMuted}`}>
              Images (JPG, PNG, GIF, WebP, SVG) and Documents (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV)
            </p>
            <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
              Maximum file size: 10MB | Maximum {maxFiles} files
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                uploadedFile.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : uploadedFile.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                {getFileIcon(uploadedFile.file)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${themeColors.colors.textPrimary} truncate`}>
                    {uploadedFile.file.name}
                  </p>
                  <p className={`text-xs ${themeColors.colors.textMuted}`}>
                    {(uploadedFile.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                {uploadedFile.status === 'uploading' && (
                  <div className="w-32">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadedFile.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}

                {uploadedFile.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}

                {uploadedFile.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
