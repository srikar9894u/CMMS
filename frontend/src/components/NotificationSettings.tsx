import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface NotificationPreferences {
  id?: number;
  user_id?: number;
  email_work_order_assigned: boolean;
  email_work_order_completed: boolean;
  email_work_order_approved: boolean;
  email_pm_reminder_7days: boolean;
  email_pm_reminder_1day: boolean;
  email_leave_request: boolean;
  email_leave_approved: boolean;
  email_inventory_low: boolean;
  email_daily_digest: boolean;
}

const NotificationSettings = () => {
  const { themeColors } = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_work_order_assigned: true,
    email_work_order_completed: true,
    email_work_order_approved: true,
    email_pm_reminder_7days: true,
    email_pm_reminder_1day: true,
    email_leave_request: true,
    email_leave_approved: true,
    email_inventory_low: true,
    email_daily_digest: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/notifications/preferences');
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch notification preferences:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await axios.put('/api/notifications/preferences', preferences);
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Notification preferences saved successfully!',
        });
        // Update with server response
        setPreferences(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save preferences',
      });
    } finally {
      setSaving(false);
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

  const notificationOptions = [
    {
      key: 'email_work_order_assigned' as keyof NotificationPreferences,
      label: 'Work Order Assigned',
      description: 'Receive email when a work order is assigned to you',
      icon: '📋',
    },
    {
      key: 'email_work_order_completed' as keyof NotificationPreferences,
      label: 'Work Order Completed',
      description: 'Receive email when a work order you created or manage is completed',
      icon: '✅',
    },
    {
      key: 'email_work_order_approved' as keyof NotificationPreferences,
      label: 'Work Order Approved',
      description: 'Receive email when your work order is approved',
      icon: '👍',
    },
    {
      key: 'email_pm_reminder_7days' as keyof NotificationPreferences,
      label: 'PM Reminder (7 Days)',
      description: 'Receive reminder 7 days before preventive maintenance is due',
      icon: '📅',
    },
    {
      key: 'email_pm_reminder_1day' as keyof NotificationPreferences,
      label: 'PM Reminder (1 Day) - Urgent',
      description: 'Receive urgent reminder 1 day before preventive maintenance is due',
      icon: '⚠️',
    },
    {
      key: 'email_leave_request' as keyof NotificationPreferences,
      label: 'Leave Request Submitted',
      description: 'Receive email when a team member submits a leave request (managers only)',
      icon: '🏖️',
    },
    {
      key: 'email_leave_approved' as keyof NotificationPreferences,
      label: 'Leave Request Decision',
      description: 'Receive email when your leave request is approved or rejected',
      icon: '✉️',
    },
    {
      key: 'email_inventory_low' as keyof NotificationPreferences,
      label: 'Low Inventory Alert',
      description: 'Receive email when inventory items are below minimum quantity (managers only)',
      icon: '📦',
    },
    {
      key: 'email_daily_digest' as keyof NotificationPreferences,
      label: 'Daily Digest (Coming Soon)',
      description: 'Receive a daily summary of all notifications',
      icon: '📰',
    },
  ];

  return (
    <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
      <div className="px-6 py-4 border-b">
        <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary}`}>
          Email Notification Preferences
        </h2>
        <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
          Choose which email notifications you want to receive
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Notification Toggles */}
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className={`flex items-start justify-between p-4 rounded-lg border ${themeColors.colors.borderLight} ${themeColors.colors.cardHover} transition-colors`}
          >
            <div className="flex items-start space-x-3 flex-1">
              <span className="text-2xl">{option.icon}</span>
              <div className="flex-1">
                <label
                  htmlFor={option.key}
                  className={`block text-sm font-medium ${themeColors.colors.textPrimary} cursor-pointer`}
                >
                  {option.label}
                </label>
                <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
                  {option.description}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id={option.key}
              type="button"
              onClick={() => handleToggle(option.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                preferences[option.key]
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                  : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={preferences[option.key]}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences[option.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
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
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
