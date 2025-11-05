import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationSettings from '../components/NotificationSettings';
import EmailConfiguration from '../components/EmailConfiguration';

const Notifications = () => {
  const { user } = useAuth();
  const { themeColors } = useTheme();
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary} mb-6`}>
        Notification Settings
      </h1>

      <div className="space-y-6">
        {/* User Notification Preferences */}
        <NotificationSettings />

        {/* Admin Email Configuration */}
        {isAdmin && <EmailConfiguration />}

        {/* Information Card */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-6`}>
          <h2 className={`text-lg font-semibold ${themeColors.colors.textPrimary} mb-3`}>
            📧 About Email Notifications
          </h2>
          <div className={`text-sm ${themeColors.colors.textSecondary} space-y-2`}>
            <p>
              The CMMS system sends automated email notifications for important events:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Work order assignments and completions</li>
              <li>Preventive maintenance reminders (7 days and 1 day before due)</li>
              <li>Leave request submissions and approvals</li>
              <li>Low inventory alerts</li>
            </ul>
            <p className="mt-3">
              You can customize which notifications you receive using the toggles above.
            </p>
            {isAdmin && (
              <p className="mt-3 font-medium">
                As an administrator, you can configure the SMTP email server settings
                to enable email delivery.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
