import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, addWeeks, startOfYear, endOfYear, eachWeekOfInterval, isSameWeek } from 'date-fns';

interface PMSchedule {
  id: number;
  asset_id: number;
  asset_name: string;
  title: string;
  frequency: string;
  frequency_value: number;
  next_due: string;
  last_completed: string;
  assigned_to_name: string;
  is_active: boolean;
}

const PMCalendar = () => {
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('/api/preventive-maintenance');
      setSchedules(response.data.filter((s: PMSchedule) => s.is_active));
    } catch (error) {
      console.error('Failed to fetch PM schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate all 52 weeks of the year
  const generateWeeks = () => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    return eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn: 1 });
  };

  const weeks = generateWeeks();

  // Get PM tasks for a specific week
  const getTasksForWeek = (weekStart: Date) => {
    return schedules.filter(schedule => {
      const dueDate = new Date(schedule.next_due);
      return isSameWeek(dueDate, weekStart, { weekStartsOn: 1 });
    });
  };

  // Color coding based on frequency
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'bg-blue-500';
      case 'monthly': return 'bg-green-500';
      case 'quarterly': return 'bg-yellow-500';
      case 'yearly': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate if task is overdue
  const isOverdue = (nextDue: string) => {
    return new Date(nextDue) < new Date();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading calendar...</div>
    </div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">52-Week PPM Calendar</h1>
            <p className="text-gray-600 mt-1">Preventive Maintenance Schedule Overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-32"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Frequency Legend:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm">Weekly</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm">Monthly</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span className="text-sm">Quarterly</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
            <span className="text-sm">Yearly</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 border-2 border-red-700 rounded mr-2"></div>
            <span className="text-sm">Overdue</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 w-48">
                Asset / Task
              </th>
              {weeks.map((week, index) => (
                <th
                  key={index}
                  className="border border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-700 min-w-[60px]"
                >
                  <div>W{index + 1}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {format(week, 'MMM d')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={weeks.length + 1} className="border border-gray-200 px-4 py-12 text-center text-gray-500">
                  No preventive maintenance schedules found. Create schedules to see them on the calendar.
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 sticky left-0 bg-white z-10">
                    <div className="text-sm font-medium text-gray-900">{schedule.asset_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{schedule.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Every {schedule.frequency_value} {schedule.frequency}
                    </div>
                  </td>
                  {weeks.map((week, weekIndex) => {
                    const tasksThisWeek = getTasksForWeek(week).filter(t => t.id === schedule.id);
                    const hasTask = tasksThisWeek.length > 0;
                    const taskIsOverdue = hasTask && isOverdue(tasksThisWeek[0].next_due);

                    return (
                      <td
                        key={weekIndex}
                        className="border border-gray-200 px-1 py-1 text-center relative"
                      >
                        {hasTask && (
                          <div
                            className={`w-full h-8 rounded ${
                              taskIsOverdue ? 'bg-red-500 border-2 border-red-700' : getFrequencyColor(schedule.frequency)
                            } flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                            title={`${schedule.asset_name} - ${schedule.title}\nDue: ${format(new Date(schedule.next_due), 'MMM d, yyyy')}\nAssigned: ${schedule.assigned_to_name || 'Unassigned'}`}
                          >
                            <span className="text-white text-xs font-medium">PM</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="card">
          <div className="text-sm text-gray-600">Total PM Schedules</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{schedules.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Weekly Tasks</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {schedules.filter(s => s.frequency === 'weekly').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Monthly Tasks</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {schedules.filter(s => s.frequency === 'monthly').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Overdue Tasks</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {schedules.filter(s => isOverdue(s.next_due)).length}
          </div>
        </div>
      </div>

      {/* Upcoming PM Tasks (Next 4 Weeks) */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks (Next 4 Weeks)</h3>
        <div className="space-y-2">
          {schedules
            .filter(s => {
              const dueDate = new Date(s.next_due);
              const fourWeeksFromNow = addWeeks(new Date(), 4);
              return dueDate >= new Date() && dueDate <= fourWeeksFromNow;
            })
            .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())
            .slice(0, 10)
            .map(schedule => (
              <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{schedule.asset_name}</div>
                  <div className="text-xs text-gray-500">{schedule.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(schedule.next_due), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">{schedule.assigned_to_name || 'Unassigned'}</div>
                </div>
              </div>
            ))}
          {schedules.filter(s => {
            const dueDate = new Date(s.next_due);
            const fourWeeksFromNow = addWeeks(new Date(), 4);
            return dueDate >= new Date() && dueDate <= fourWeeksFromNow;
          }).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks scheduled for the next 4 weeks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PMCalendar;
