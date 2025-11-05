import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Paperclip } from 'lucide-react';
import FileUpload from './FileUpload';
import FileGallery from './FileGallery';

interface AttachmentsSectionProps {
  entityType: 'work_order' | 'asset' | 'inventory';
  entityId: number;
  title?: string;
  collapsible?: boolean;
}

const AttachmentsSection = ({
  entityType,
  entityId,
  title = 'Attachments',
  collapsible = true,
}: AttachmentsSectionProps) => {
  const { themeColors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={`${themeColors.colors.card} border ${themeColors.colors.cardBorder} rounded-lg shadow-sm overflow-hidden`}>
      {/* Header */}
      <div
        className={`px-6 py-4 border-b ${themeColors.colors.borderLight} flex items-center justify-between ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Paperclip className="w-5 h-5" />
          <h3 className={`text-lg font-semibold ${themeColors.colors.textPrimary}`}>
            {title}
          </h3>
        </div>
        {collapsible && (
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <h4 className={`text-sm font-medium ${themeColors.colors.textSecondary} mb-3`}>
              Upload New Files
            </h4>
            <FileUpload
              entityType={entityType}
              entityId={entityId}
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* File Gallery */}
          <div>
            <h4 className={`text-sm font-medium ${themeColors.colors.textSecondary} mb-3`}>
              Uploaded Files
            </h4>
            <FileGallery
              entityType={entityType}
              entityId={entityId}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentsSection;
