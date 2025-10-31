import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

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
  asset_id: number | null;
  inventory_id: number | null;
  tags: string | null;
  download_count: number;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  value: string;
  label: string;
}

const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form data for upload
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'manual',
    tags: '',
    url: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, categoryFilter]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/documents/meta/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }

    setFilteredDocuments(filtered);
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

    setUploadProgress(true);

    const formDataToSend = new FormData();
    formDataToSend.append('file', selectedFile);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('tags', formData.tags);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Document uploaded successfully!');
        setShowUploadModal(false);
        resetForm();
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/documents/link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          url: formData.url,
          tags: formData.tags
        })
      });

      if (response.ok) {
        alert('Link added successfully!');
        setShowLinkModal(false);
        resetForm();
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link');
    }
  };

  const handleDownload = async (doc: Document) => {
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

        // Refresh to update download count
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'manual',
      tags: '',
      url: ''
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

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      manual: 'bg-blue-100 text-blue-800',
      drawing: 'bg-purple-100 text-purple-800',
      specification: 'bg-green-100 text-green-800',
      report: 'bg-yellow-100 text-yellow-800',
      procedure: 'bg-indigo-100 text-indigo-800',
      link: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
            <p className="text-gray-600 mt-1">Manuals, drawings, specifications, and resources</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <span>🔗</span>
              Add Link
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <span>📤</span>
              Upload Document
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Documents</div>
            <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Filtered Results</div>
            <div className="text-2xl font-bold text-blue-600">{filteredDocuments.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Categories</div>
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">External Links</div>
            <div className="text-2xl font-bold text-purple-600">
              {documents.filter(d => d.external_url).length}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="text-4xl">{getFileIcon(doc.file_type, doc.external_url)}</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryBadgeColor(doc.category)}`}>
                  {categories.find(c => c.value === doc.category)?.label || doc.category}
                </span>
              </div>

              <h3 className="font-semibold text-lg text-gray-900 mb-1">{doc.title}</h3>

              {doc.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doc.description}</p>
              )}

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                {doc.external_url ? (
                  <div className="flex items-center gap-1">
                    <span>🔗</span>
                    <span className="truncate">{doc.external_url}</span>
                  </div>
                ) : (
                  <>
                    <div>File: {doc.original_filename}</div>
                    <div>Size: {formatFileSize(doc.file_size)}</div>
                  </>
                )}
                <div>Downloads: {doc.download_count}</div>
                <div>Uploaded by: {doc.uploaded_by_name}</div>
                <div>Date: {new Date(doc.created_at).toLocaleDateString()}</div>
              </div>

              {doc.tags && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.split(',').map((tag, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
                >
                  {doc.external_url ? 'Open Link' : 'Download'}
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">📂</div>
            <p className="text-gray-600 text-lg">No documents found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm || categoryFilter
                ? 'Try adjusting your filters'
                : 'Upload your first document to get started'}
            </p>
          </div>
        )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          resetForm();
        }}
        title="Upload Document"
      >
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
              Max 50MB. Supported: PDF, Word, Excel, Images, CAD files, Archives
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter document title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Comma-separated tags (e.g., motor, manual, electrical)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={uploadProgress}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              disabled={uploadProgress}
            >
              {uploadProgress ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          resetForm();
        }}
        title="Add External Link"
      >
        <form onSubmit={handleAddLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="https://example.com/document"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter link title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Comma-separated tags"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowLinkModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentLibrary;
