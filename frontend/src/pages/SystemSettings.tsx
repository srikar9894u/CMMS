import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import ThemeSelector from '../components/ThemeSelector';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
  updated_at: string;
}

const SystemSettings = () => {
  const { themeColors } = useTheme();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/system/settings');
      setSettings(response.data);

      // Extract company name and logo
      const nameSetting = response.data.find((s: SystemSetting) => s.setting_key === 'company_name');
      const logoSetting = response.data.find((s: SystemSetting) => s.setting_key === 'company_logo');

      setCompanyName(nameSetting?.setting_value || '');
      setLogoUrl(logoSetting?.setting_value || null);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and SVG images are allowed.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post('/api/uploads/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setLogoUrl(response.data.path);
      await fetchSettings(); // Refresh settings
      alert('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      alert(error.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the company logo?')) {
      return;
    }

    try {
      await axios.delete('/api/uploads/logo');
      setLogoUrl(null);
      await fetchSettings();
      alert('Logo deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete logo:', error);
      alert(error.response?.data?.error || 'Failed to delete logo');
    }
  };

  const handleUpdateCompanyName = async () => {
    try {
      await axios.put('/api/system/settings/company_name', {
        setting_value: companyName
      });
      await fetchSettings();
      alert('Company name updated successfully!');
    } catch (error: any) {
      console.error('Failed to update company name:', error);
      alert(error.response?.data?.error || 'Failed to update company name');
    }
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary} mb-6`}>
        System Settings
      </h1>

      {/* Branding Section */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-6 mb-6`}>
        <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary} mb-4`}>Branding & Appearance</h2>

        {/* Company Name */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
            Company Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`flex-1 px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="Enter company name"
            />
            <button
              onClick={handleUpdateCompanyName}
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-6 py-2 rounded-lg font-medium transition-colors`}
            >
              Update
            </button>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
            Company Logo
          </label>

          {logoUrl && (
            <div className="mb-4 p-4 border rounded-lg inline-block">
              <img
                src={logoUrl}
                alt="Company Logo"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <label className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {logoUrl && (
              <button
                onClick={handleDeleteLogo}
                className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-6 py-2 rounded-lg font-medium transition-colors`}
              >
                Delete Logo
              </button>
            )}
          </div>
          <p className={`text-xs ${themeColors.colors.textMuted} mt-2`}>
            Accepted formats: JPEG, PNG, GIF, SVG. Maximum size: 5MB
          </p>
        </div>
      </div>

      {/* UI Theme Selector */}
      <div className="mb-6">
        <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary} mb-4`}>UI Theme</h2>
        <ThemeSelector />
      </div>

      {/* All Settings Table */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
        <div className="px-6 py-4 border-b">
          <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary}`}>All System Settings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className={themeColors.colors.secondary}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Setting Key
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Value
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden md:table-cell`}>
                  Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden lg:table-cell`}>
                  Description
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden xl:table-cell`}>
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className={`${themeColors.colors.card} divide-y ${themeColors.colors.borderLight}`}>
              {settings.map((setting) => (
                <tr key={setting.id} className={themeColors.colors.cardHover}>
                  <td className={`px-6 py-4 text-sm font-mono ${themeColors.colors.textPrimary}`}>
                    {setting.setting_key}
                  </td>
                  <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                    {setting.setting_value || <span className={themeColors.colors.textMuted}>null</span>}
                  </td>
                  <td className={`px-6 py-4 text-sm ${themeColors.colors.textMuted} hidden md:table-cell`}>
                    {setting.setting_type}
                  </td>
                  <td className={`px-6 py-4 text-sm ${themeColors.colors.textMuted} hidden lg:table-cell`}>
                    {setting.description || '-'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${themeColors.colors.textMuted} hidden xl:table-cell`}>
                    {new Date(setting.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
