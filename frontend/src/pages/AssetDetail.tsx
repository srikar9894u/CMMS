import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  location: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  warranty_expiry: string;
  status: string;
  criticality: string;
  description: string;
  notes: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  category: string;
  file_path: string | null;
  file_type: string;
  file_size: number | null;
  original_filename: string | null;
  external_url: string | null;
  tags: string | null;
  download_count: number;
  uploaded_by_name: string;
  created_at: string;
}

const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    category: 'manual',
    tags: ''
  });

  useEffect(() => {
    fetchAsset();
    fetchDocuments();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const response = await axios.get(`/api/assets/${id}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Failed to fetch asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/documents?asset_id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadFormData.title);
    formData.append('description', uploadFormData.description);
    formData.append('category', uploadFormData.category);
    formData.append('tags', uploadFormData.tags);
    formData.append('asset_id', id || '');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Document uploaded successfully!');
        setShowUploadModal(false);
        resetUploadForm();
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const token = localStorage.getItem('token');

      if (doc.external_url) {
        window.open(doc.external_url, '_blank');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/documents/${doc.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_filename || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Document deleted successfully');
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const resetUploadForm = () => {
    setUploadFormData({
      title: '',
      description: '',
      category: 'manual',
      tags: ''
    });
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType: string, externalUrl: string | null) => {
    if (externalUrl) return '🔗';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('cad') || fileType.includes('dwg') || fileType.includes('dxf')) return '📐';
    return '📁';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!asset) {
    return <div>Asset not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/assets" className="text-primary-600 hover:text-primary-900">
          ← Back to Assets
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
        <button className="btn btn-primary">Edit Asset</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Asset Tag</dt>
              <dd className="text-sm text-gray-900">{asset.asset_tag}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900">{asset.category}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-sm text-gray-900">{asset.location || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 capitalize">{asset.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Criticality</dt>
              <dd className="text-sm text-gray-900 capitalize">{asset.criticality || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
              <dd className="text-sm text-gray-900">{asset.manufacturer || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="text-sm text-gray-900">{asset.model || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
              <dd className="text-sm text-gray-900">{asset.serial_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
              <dd className="text-sm text-gray-900">{asset.purchase_date || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Warranty Expiry</dt>
              <dd className="text-sm text-gray-900">{asset.warranty_expiry || '-'}</dd>
            </div>
          </dl>
        </div>

        {asset.description && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-sm text-gray-700">{asset.description}</p>
          </div>
        )}

        {asset.notes && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700">{asset.notes}</p>
          </div>
        )}

        {/* Documents Section */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Documents & Manuals</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <span>📤</span>
              Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <div className="text-gray-400 text-4xl mb-2">📂</div>
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-gray-400 text-sm">Upload manuals, drawings, or specifications for this asset</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{getFileIcon(doc.file_type, doc.external_url)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{doc.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <div>Category: {doc.category}</div>
                        {doc.original_filename && <div>File: {doc.original_filename}</div>}
                        {doc.file_size && <div>Size: {formatFileSize(doc.file_size)}</div>}
                        <div>Downloads: {doc.download_count}</div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
                        >
                          {doc.external_url ? 'Open Link' : 'Download'}
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Upload Document</h2>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.dwg,.dxf,.txt,.zip"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 50MB. PDF, Word, Excel, Images, CAD files
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={uploadFormData.category}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, category: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="manual">Manual</option>
                  <option value="drawing">Drawing</option>
                  <option value="specification">Specification</option>
                  <option value="report">Report</option>
                  <option value="procedure">Procedure</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={uploadFormData.tags}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, tags: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Comma-separated tags"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;
