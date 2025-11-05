import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Download, Trash2, Eye, Image, FileText, File, X } from 'lucide-react';

interface Attachment {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: 'image' | 'document';
  mime_type: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
}

interface FileGalleryProps {
  entityType: 'work_order' | 'asset' | 'inventory';
  entityId: number;
  refreshTrigger?: number;
}

const FileGallery = ({ entityType, entityId, refreshTrigger }: FileGalleryProps) => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<Attachment | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId, refreshTrigger]);

  const fetchAttachments = async () => {
    try {
      const response = await axios.get(`/api/attachments`, {
        params: { entity_type: entityType, entity_id: entityId },
      });
      if (response.data.success) {
        setAttachments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await axios.get(`/api/attachments/${attachment.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete "${attachment.original_filename}"?`)) return;

    try {
      await axios.delete(`/api/attachments/${attachment.id}`);
      fetchAttachments();
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const handleView = (attachment: Attachment) => {
    if (attachment.file_type === 'image') {
      setViewingImage(attachment);
    } else if (attachment.mime_type === 'application/pdf') {
      window.open(`/api/attachments/${attachment.id}/view`, '_blank');
    } else {
      handleDownload(attachment);
    }
  };

  const canDelete = (attachment: Attachment) => {
    return attachment.uploaded_by === user?.id || user?.role === 'admin' || user?.role === 'manager';
  };

  const getFileIcon = (attachment: Attachment) => {
    if (attachment.file_type === 'image') {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (attachment.mime_type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={`${themeColors.colors.card} border ${themeColors.colors.cardBorder} rounded-lg p-6`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className={`${themeColors.colors.card} border ${themeColors.colors.cardBorder} rounded-lg p-6 text-center`}>
        <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className={`${themeColors.colors.textMuted}`}>No attachments yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${themeColors.colors.cardBorder} ${themeColors.colors.cardHover} transition-colors`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(attachment)}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${themeColors.colors.textPrimary} truncate`}>
                  {attachment.original_filename}
                </p>
                <p className={`text-xs ${themeColors.colors.textMuted}`}>
                  {formatFileSize(attachment.file_size)} • Uploaded by {attachment.uploaded_by_name} •{' '}
                  {new Date(attachment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleView(attachment)}
                className={`p-2 rounded hover:${themeColors.colors.secondary} transition-colors`}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload(attachment)}
                className={`p-2 rounded hover:${themeColors.colors.secondary} transition-colors`}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              {canDelete(attachment) && (
                <button
                  onClick={() => handleDelete(attachment)}
                  className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={`/api/attachments/${viewingImage.id}/view`}
              alt={viewingImage.original_filename}
              className="max-w-full max-h-screen object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FileGallery;
