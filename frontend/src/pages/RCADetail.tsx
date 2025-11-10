import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Check, X, Edit2 } from 'lucide-react';

interface Fishbone {
  id?: number;
  category: string;
  cause: string;
  sub_causes?: string;
  severity: number;
  notes?: string;
}

interface FiveWhys {
  id?: number;
  why_level: number;
  question: string;
  answer: string;
  is_root_cause: boolean;
  evidence?: string;
}

interface RecommendedAction {
  id: number;
  action_type: string;
  description: string;
  priority: string;
  status: string;
  assigned_to_name?: string;
  due_date?: string;
}

const RCADetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rca, setRca] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);

  // Fishbone state
  const [fishboneData, setFishboneData] = useState<Fishbone[]>([]);
  const [newFishbone, setNewFishbone] = useState<Fishbone>({
    category: 'man',
    cause: '',
    severity: 1
  });
  const [showFishboneForm, setShowFishboneForm] = useState(false);

  // 5 Whys state
  const [fiveWhysData, setFiveWhysData] = useState<FiveWhys[]>([]);
  const [newWhys, setNewWhys] = useState<FiveWhys>({
    why_level: 1,
    question: '',
    answer: '',
    is_root_cause: false
  });
  const [showWhysForm, setShowWhysForm] = useState(false);

  // Actions state
  const [actions, setActions] = useState<RecommendedAction[]>([]);
  const [newAction, setNewAction] = useState({
    action_type: 'corrective',
    description: '',
    priority: 'medium'
  });
  const [showActionForm, setShowActionForm] = useState(false);

  useEffect(() => {
    fetchRCADetail();
  }, [id]);

  const fetchRCADetail = async () => {
    try {
      const response = await axios.get(`/api/rca/${id}`);
      setRca(response.data);
      setFishboneData(response.data.fishbone_data || []);
      setFiveWhysData(response.data.five_whys_data || []);
      setActions(response.data.actions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching RCA detail:', error);
      setLoading(false);
    }
  };

  const addFishboneCause = async () => {
    try {
      await axios.post(`/api/rca/${id}/fishbone`, newFishbone);
      fetchRCADetail();
      setNewFishbone({ category: 'man', cause: '', severity: 1 });
      setShowFishboneForm(false);
    } catch (error) {
      console.error('Error adding fishbone cause:', error);
    }
  };

  const addFiveWhys = async () => {
    try {
      await axios.post(`/api/rca/${id}/five-whys`, newWhys);
      fetchRCADetail();
      setNewWhys({
        why_level: fiveWhysData.length + 1,
        question: '',
        answer: '',
        is_root_cause: false
      });
      setShowWhysForm(false);
    } catch (error) {
      console.error('Error adding 5 whys:', error);
    }
  };

  const addAction = async () => {
    try {
      await axios.post(`/api/rca/${id}/actions`, newAction);
      fetchRCADetail();
      setNewAction({ action_type: 'corrective', description: '', priority: 'medium' });
      setShowActionForm(false);
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  const updateRCAStatus = async (newStatus: string) => {
    try {
      await axios.put(`/api/rca/${id}`, { status: newStatus });
      fetchRCADetail();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const saveRootCause = async () => {
    try {
      await axios.put(`/api/rca/${id}`, {
        root_cause: rca.root_cause,
        immediate_cause: rca.immediate_cause,
        contributing_factors: rca.contributing_factors
      });
      setEditMode(false);
      alert('Root cause analysis saved successfully');
    } catch (error) {
      console.error('Error saving root cause:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!rca) {
    return <div className="text-center py-12">RCA investigation not found</div>;
  }

  const fishboneCategories = {
    man: { label: 'Man (People)', color: 'bg-red-100 text-red-800' },
    machine: { label: 'Machine (Equipment)', color: 'bg-blue-100 text-blue-800' },
    method: { label: 'Method (Process)', color: 'bg-green-100 text-green-800' },
    material: { label: 'Material', color: 'bg-yellow-100 text-yellow-800' },
    measurement: { label: 'Measurement', color: 'bg-purple-100 text-purple-800' },
    environment: { label: 'Environment', color: 'bg-pink-100 text-pink-800' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rca')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{rca.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                rca.severity === 'critical' ? 'bg-red-100 text-red-800' :
                rca.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                rca.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {rca.severity} severity
              </span>
              <span className="text-gray-600">Method: {rca.analysis_method.replace('_', ' ')}</span>
              <span className="text-gray-600">Created: {new Date(rca.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {rca.status !== 'approved' && rca.status !== 'closed' && (
            <button
              onClick={() => updateRCAStatus(rca.status === 'initiated' ? 'investigating' :
                rca.status === 'investigating' ? 'analysis_complete' : 'actions_defined')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Advance Status
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {['overview', 'fishbone', 'five_whys', 'actions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Investigation Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Asset:</span> {rca.asset_name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Work Order:</span> {rca.work_order_title || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Assigned To:</span> {rca.assigned_to_name || 'Unassigned'}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{rca.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-medium">Description:</span>
                <p className="mt-1 text-gray-600">{rca.description || 'No description'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Root Cause Findings</h3>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveRootCause}
                    className="text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-gray-600 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Immediate Cause</label>
                {editMode ? (
                  <textarea
                    value={rca.immediate_cause || ''}
                    onChange={(e) => setRca({ ...rca, immediate_cause: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-600">{rca.immediate_cause || 'Not determined'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
                {editMode ? (
                  <textarea
                    value={rca.root_cause || ''}
                    onChange={(e) => setRca({ ...rca, root_cause: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-600">{rca.root_cause || 'Not determined'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contributing Factors</label>
                {editMode ? (
                  <textarea
                    value={rca.contributing_factors || ''}
                    onChange={(e) => setRca({ ...rca, contributing_factors: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-600">{rca.contributing_factors || 'Not determined'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fishbone Tab */}
      {activeTab === 'fishbone' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Fishbone Diagram (6M Analysis)</h3>
            <button
              onClick={() => setShowFishboneForm(!showFishboneForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Cause
            </button>
          </div>

          {showFishboneForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-4">Add New Cause</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={newFishbone.category}
                    onChange={(e) => setNewFishbone({ ...newFishbone, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(fishboneCategories).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severity (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newFishbone.severity}
                    onChange={(e) => setNewFishbone({ ...newFishbone, severity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Cause</label>
                  <input
                    type="text"
                    value={newFishbone.cause}
                    onChange={(e) => setNewFishbone({ ...newFishbone, cause: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe the cause..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Sub-causes (optional)</label>
                  <input
                    type="text"
                    value={newFishbone.sub_causes || ''}
                    onChange={(e) => setNewFishbone({ ...newFishbone, sub_causes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Contributing sub-causes..."
                  />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button
                    onClick={() => setShowFishboneForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addFishboneCause}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Cause
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(fishboneCategories).map(([category, info]) => {
              const causes = fishboneData.filter(f => f.category === category);
              return (
                <div key={category} className="bg-white rounded-lg shadow">
                  <div className={`p-4 ${info.color} font-semibold rounded-t-lg`}>
                    {info.label} ({causes.length})
                  </div>
                  <div className="p-4 space-y-2">
                    {causes.length === 0 ? (
                      <p className="text-gray-400 text-sm">No causes identified</p>
                    ) : (
                      causes.map((cause) => (
                        <div key={cause.id} className="border-l-4 border-gray-300 pl-3 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{cause.cause}</p>
                              {cause.sub_causes && (
                                <p className="text-sm text-gray-600 mt-1">{cause.sub_causes}</p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs ${i < cause.severity ? 'text-yellow-500' : 'text-gray-300'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5 Whys Tab */}
      {activeTab === 'five_whys' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">5 Whys Analysis</h3>
            <button
              onClick={() => setShowWhysForm(!showWhysForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Why
            </button>
          </div>

          {showWhysForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-4">Add Why #{fiveWhysData.length + 1}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question</label>
                  <input
                    type="text"
                    value={newWhys.question}
                    onChange={(e) => setNewWhys({ ...newWhys, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Why did this happen?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Answer</label>
                  <textarea
                    value={newWhys.answer}
                    onChange={(e) => setNewWhys({ ...newWhys, answer: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Because..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newWhys.is_root_cause}
                      onChange={(e) => setNewWhys({ ...newWhys, is_root_cause: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">This is the root cause</span>
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowWhysForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addFiveWhys}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Why
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            {fiveWhysData.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No why analysis yet. Start adding questions above.</p>
            ) : (
              <div className="space-y-4">
                {fiveWhysData.map((why) => (
                  <div key={why.id} className={`p-4 rounded-lg ${why.is_root_cause ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        why.is_root_cause ? 'bg-green-600' : 'bg-blue-600'
                      }`}>
                        {why.why_level}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{why.question}</p>
                        <p className="text-gray-700 mt-2">{why.answer}</p>
                        {why.is_root_cause && (
                          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            <Check className="w-4 h-4" /> Root Cause Identified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recommended Actions</h3>
            <button
              onClick={() => setShowActionForm(!showActionForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Action
            </button>
          </div>

          {showActionForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-4">Add Recommended Action</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Action Type</label>
                  <select
                    value={newAction.action_type}
                    onChange={(e) => setNewAction({ ...newAction, action_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="corrective">Corrective</option>
                    <option value="preventive">Preventive</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={newAction.priority}
                    onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newAction.description}
                    onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe the recommended action..."
                  />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button
                    onClick={() => setShowActionForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Action
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {actions.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No actions recommended yet</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {actions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="capitalize text-sm font-medium">{action.action_type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{action.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          action.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          action.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {action.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          action.status === 'completed' ? 'bg-green-100 text-green-800' :
                          action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {action.assigned_to_name || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RCADetail;
