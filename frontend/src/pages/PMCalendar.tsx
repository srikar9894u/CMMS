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

  // Define quarters with week ranges
  const quarters = [
    { name: 'Q1', startWeek: 1, endWeek: 13, weeks: weeks.slice(0, 13) },
    { name: 'Q2', startWeek: 14, endWeek: 26, weeks: weeks.slice(13, 26) },
    { name: 'Q3', startWeek: 27, endWeek: 39, weeks: weeks.slice(26, 39) },
    { name: 'Q4', startWeek: 40, endWeek: 52, weeks: weeks.slice(39, 52) },
  ];

  // Frequency types for rows
  const frequencyTypes = [
    { name: 'Weekly', value: 'weekly', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
    { name: 'Monthly', value: 'monthly', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
    { name: 'Quarterly', value: 'quarterly', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50' },
    { name: 'Yearly', value: 'yearly', color: 'bg-purple-500', textColor: 'text-purple-700', bgLight: 'bg-purple-50' },
  ];

  // Get PM tasks for a specific quarter and frequency
  const getTasksForQuarter = (quarterWeeks: Date[], frequency: string) => {
    return schedules.filter(schedule => {
      if (schedule.frequency !== frequency) return false;
      const dueDate = new Date(schedule.next_due);
      return quarterWeeks.some(week => isSameWeek(dueDate, week, { weekStartsOn: 1 }));
    });
  };

  // Get week number for a task's due date
  const getWeekNumber = (dueDate: string) => {
    const date = new Date(dueDate);
    const weekIndex = weeks.findIndex(week => isSameWeek(date, week, { weekStartsOn: 1 }));
    return weekIndex >= 0 ? weekIndex + 1 : null;
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
            <p className="text-gray-600 mt-1">Quarterly view of preventive maintenance schedules organized by frequency type</p>
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

      {/* Calendar Grid - Quarterly Layout */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-700 w-48">
                Frequency Type
              </th>
              {quarters.map((quarter) => (
                <th
                  key={quarter.name}
                  className="border border-gray-200 px-4 py-4 text-center text-sm font-semibold text-gray-700"
                >
                  <div className="text-lg">{quarter.name}</div>
                  <div className="text-xs text-gray-500 font-normal mt-1">
                    Weeks {quarter.startWeek}-{quarter.endWeek}
                  </div>
                  <div className="text-xs text-gray-400 font-normal">
                    {format(quarter.weeks[0], 'MMM d')} - {format(quarter.weeks[quarter.weeks.length - 1], 'MMM d')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-200 px-4 py-12 text-center text-gray-500">
                  No preventive maintenance schedules found. Create schedules to see them on the calendar.
                </td>
              </tr>
            ) : (
              frequencyTypes.map((freqType) => (
                <tr key={freqType.value} className={`${freqType.bgLight} hover:opacity-80 transition-opacity`}>
                  <td className="border border-gray-200 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 ${freqType.color} rounded`}></div>
                      <span className={`text-sm font-semibold ${freqType.textColor}`}>
                        {freqType.name}
                      </span>
                    </div>
                  </td>
                  {quarters.map((quarter) => {
                    const tasks = getTasksForQuarter(quarter.weeks, freqType.value);

                    return (
                      <td
                        key={quarter.name}
                        className="border border-gray-200 px-3 py-4 align-top"
                      >
                        {tasks.length > 0 ? (
                          <div className="space-y-2">
                            {tasks.map((task) => {
                              const weekNum = getWeekNumber(task.next_due);
                              const taskOverdue = isOverdue(task.next_due);

                              return (
                                <div
                                  key={task.id}
                                  className={`p-2 rounded-lg border-l-4 ${
                                    taskOverdue
                                      ? 'bg-red-50 border-red-500'
                                      : 'bg-white border-gray-300'
                                  } shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                                  title={`Asset: ${task.asset_name}\nTask: ${task.title}\nDue: ${format(new Date(task.next_due), 'MMM d, yyyy')}\nAssigned: ${task.assigned_to_name || 'Unassigned'}\nEvery: ${task.frequency_value} ${task.frequency}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-gray-900 truncate">
                                        {task.asset_name}
                                      </div>
                                      <div className="text-xs text-gray-600 truncate mt-0.5">
                                        {task.title}
                                      </div>
                                    </div>
                                    <div className="ml-2">
                                      <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded ${
                                        taskOverdue ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        W{weekNum}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {format(new Date(task.next_due), 'MMM d')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-gray-400 py-4">
                            No tasks
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
