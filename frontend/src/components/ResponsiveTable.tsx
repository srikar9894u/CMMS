/**
 * ResponsiveTable Component
 * Mobile-friendly table that switches to card layout on small screens
 */

import { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Column {
  key: string;
  label: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  render?: (value: any, row: any) => ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyField?: string;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

const ResponsiveTable = ({
  columns,
  data,
  keyField = 'id',
  onRowClick,
  emptyMessage = 'No data available'
}: ResponsiveTableProps) => {
  const { themeColors } = useTheme();

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 ${themeColors.colors.textMuted}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`min-w-full divide-y ${themeColors.colors.borderLight}`}>
          <thead className={`${themeColors.colors.secondary}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 lg:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider
                    ${column.hideOnTablet ? 'hidden lg:table-cell' : ''}
                  `}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${themeColors.colors.card} divide-y ${themeColors.colors.borderLight}`}>
            {data.map((row) => (
              <tr
                key={row[keyField]}
                className={`${themeColors.colors.cardHover} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textPrimary}
                      ${column.hideOnTablet ? 'hidden lg:table-cell' : ''}
                    `}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div
            key={row[keyField]}
            className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg p-4 ${
              onRowClick ? 'cursor-pointer active:scale-98 transition-transform' : ''
            }`}
            onClick={() => onRowClick?.(row)}
          >
            {columns
              .filter(column => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <span className={`text-sm font-medium ${themeColors.colors.textSecondary}`}>
                    {column.label}:
                  </span>
                  <span className={`text-sm ${themeColors.colors.textPrimary} text-right ml-4`}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;
