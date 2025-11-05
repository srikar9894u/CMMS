import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

const EmailConfiguration = () => {
  const { themeColors } = useTheme();
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'CMMS System',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/notifications/email-config');
      if (response.data.success && response.data.data) {
        setConfig({
          ...response.data.data,
          smtp_password: '', // Don't show password
        });
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
        setMessage({
          type: 'info',
          text: 'Email not configured yet. Please configure SMTP settings below.',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch email config:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EmailConfig, value: string | number | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    setConnectionStatus('testing');

    try {
      const response = await axios.post('/api/notifications/email-config/test', config);
      if (response.data.success) {
        setConnectionStatus('connected');
        setMessage({
          type: 'success',
          text: 'Connection test successful! SMTP settings are valid.',
        });
      } else {
        setConnectionStatus('disconnected');
        setMessage({
          type: 'error',
          text: 'Connection test failed. Please check your SMTP settings.',
        });
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!config.smtp_host || !config.smtp_port || !config.from_email) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields: SMTP Host, Port, and From Email',
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await axios.post('/api/notifications/email-config', config);
      if (response.data.success) {
        setConnectionStatus('connected');
        setMessage({
          type: 'success',
          text: 'Email configuration saved successfully!',
        });
        // Clear password field after save
        setConfig((prev) => ({ ...prev, smtp_password: '' }));
      }
    } catch (error: any) {
      console.error('Failed to save email config:', error);
      setConnectionStatus('disconnected');
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save configuration',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await axios.post('/api/notifications/test', { email: testEmail });
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Test email sent successfully to ${testEmail}!`,
        });
        setTestEmail('');
      }
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary}`}>
            Email Configuration (Admin Only)
          </h2>
          <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
            Configure SMTP settings for sending email notifications
          </p>
        </div>
        {/* Connection Status Indicator */}
        {connectionStatus && (
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'testing'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            ></div>
            <span className={`text-sm font-medium ${themeColors.colors.textSecondary}`}>
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'testing'
                ? 'Testing...'
                : 'Not Connected'}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* SMTP Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SMTP Host */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              SMTP Host <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.smtp_host}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder="smtp.gmail.com"
              className={`w-full px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>

          {/* SMTP Port */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              SMTP Port <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={config.smtp_port}
              onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
              placeholder="587"
              className={`w-full px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>

          {/* SMTP Username */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              SMTP Username
            </label>
            <input
              type="text"
              value={config.smtp_username}
              onChange={(e) => handleChange('smtp_username', e.target.value)}
              placeholder="your-email@gmail.com"
              className={`w-full px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              SMTP Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.smtp_password}
                onChange={(e) => handleChange('smtp_password', e.target.value)}
                placeholder="Enter password"
                className={`w-full px-4 py-2 pr-10 rounded-lg border ${themeColors.colors.input}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeColors.colors.textMuted} hover:${themeColors.colors.textPrimary}`}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* From Email */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              From Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={config.from_email}
              onChange={(e) => handleChange('from_email', e.target.value)}
              placeholder="noreply@cmms.local"
              className={`w-full px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>

          {/* From Name */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              From Name
            </label>
            <input
              type="text"
              value={config.from_name}
              onChange={(e) => handleChange('from_name', e.target.value)}
              placeholder="CMMS System"
              className={`w-full px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>
        </div>

        {/* SMTP Secure Toggle */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handleChange('smtp_secure', !config.smtp_secure)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              config.smtp_secure
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={config.smtp_secure}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.smtp_secure ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <label className={`text-sm font-medium ${themeColors.colors.textPrimary}`}>
            Use Secure Connection (SSL/TLS)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <button
            onClick={handleTestConnection}
            disabled={testing || saving}
            className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
          >
            {testing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Test Connection</span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || testing}
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>

        {/* Test Email Section */}
        <div className="pt-4 border-t">
          <h3 className={`text-lg font-semibold ${themeColors.colors.textPrimary} mb-3`}>
            Send Test Email
          </h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className={`flex-1 px-4 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
            <button
              onClick={handleSendTestEmail}
              disabled={testing || !testEmail}
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
            >
              {testing ? 'Sending...' : 'Send Test'}
            </button>
          </div>
          <p className={`text-xs ${themeColors.colors.textMuted} mt-2`}>
            Send a test email to verify your configuration
          </p>
        </div>

        {/* Help Text */}
        <div className={`p-4 rounded-lg ${themeColors.colors.secondary} border ${themeColors.colors.borderLight}`}>
          <h4 className={`text-sm font-semibold ${themeColors.colors.textPrimary} mb-2`}>
            Common SMTP Providers:
          </h4>
          <ul className={`text-xs ${themeColors.colors.textMuted} space-y-1`}>
            <li>• Gmail: smtp.gmail.com:587 (Enable "App Passwords" in Google Account)</li>
            <li>• Outlook: smtp-mail.outlook.com:587</li>
            <li>• Yahoo: smtp.mail.yahoo.com:587</li>
            <li>• SendGrid: smtp.sendgrid.net:587</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailConfiguration;
