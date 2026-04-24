import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOpp, setNewOpp] = useState({ title: '', type: 'Scholarship', sport: '', minScore: 0, targetAgeMin: 0, targetAgeMax: 100, description: '' });

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } else if (activeTab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsers(data);
      } else if (activeTab === 'events') {
        const { data } = await api.get('/events');
        setEvents(data);
      } else if (activeTab === 'opportunities') {
        const { data } = await api.get('/admin/opportunities');
        setOpportunities(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // User Management Handlers
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchAdminData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status });
      fetchAdminData();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure? This will delete the user and all associated data.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchAdminData();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  // Event Moderation Handlers
  const handleEventVerification = async (eventId, verificationStatus) => {
    try {
      await api.put(`/admin/events/${eventId}/verify`, { verificationStatus });
      fetchAdminData();
    } catch (error) {
      alert('Failed to update event status');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Delete this event?')) {
      try {
        await api.delete(`/events/${eventId}`);
        fetchAdminData();
      } catch (error) {
        alert('Failed to delete event');
      }
    }
  };


  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/opportunities', { ...newOpp, source: 'Manual', status: 'Active' });
      setShowCreateForm(false);
      setNewOpp({ title: '', type: 'Scholarship', sport: '', minScore: 0, targetAgeMin: 0, targetAgeMax: 100, description: '' });
      fetchAdminData();
    } catch (error) {
      alert('Failed to create opportunity');
    }
  };

  const handleUpdateOpportunityStatus = async (oppId, status) => {
    try {
      await api.put(`/admin/opportunities/${oppId}`, { status });
      fetchAdminData();
    } catch (error) {
      alert('Failed to update opportunity status');
    }
  };

  const handleDeleteOpportunity = async (oppId) => {
    if (window.confirm('Delete this opportunity?')) {
      try {
        await api.delete(`/admin/opportunities/${oppId}`);
        fetchAdminData();
      } catch (error) {
        alert('Failed to delete opportunity');
      }
    }
  };

  const renderDashboard = () => {
    if (!stats) return null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-indigo-500">
            <p className="text-slate-500 font-bold uppercase text-xs mb-1">Total Users</p>
            <p className="text-3xl font-black text-slate-800">{stats.users.total}</p>
            <div className="mt-2 text-xs text-slate-500 flex gap-2">
              <span>{stats.users.athletes} Athl.</span>
              <span>{stats.users.organizers} Org.</span>
              <span>{stats.users.admins} Adm.</span>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-purple-500">
            <p className="text-slate-500 font-bold uppercase text-xs mb-1">Total Events</p>
            <p className="text-3xl font-black text-slate-800">{stats.events.total}</p>
            <div className="mt-2 text-xs text-slate-500 flex gap-2">
              <span>{stats.events.upcoming} Upcoming</span>
              <span>{stats.events.completed} Completed</span>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-amber-500">
            <p className="text-slate-500 font-bold uppercase text-xs mb-1">Total Participations</p>
            <p className="text-3xl font-black text-slate-800">{stats.participations}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-emerald-500">
            <p className="text-slate-500 font-bold uppercase text-xs mb-1">Opportunities</p>
            <p className="text-3xl font-black text-slate-800">{stats.opportunities}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">User Management</h2>
      <div className="glass-panel rounded-3xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="p-4 font-bold">Name & Email</th>
              <th className="p-4 font-bold">Role</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/50">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </td>
                <td className="p-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-1"
                  >
                    <option value="Athlete">Athlete</option>
                    <option value="Organizer">Organizer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="p-4">
                  <select
                    value={u.status || 'Active'}
                    onChange={(e) => handleStatusChange(u._id, e.target.value)}
                    className={`text-sm rounded-lg p-1 font-bold ${u.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </td>
                <td className="p-4">
                  <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Event Verification & Moderation</h2>
      <div className="glass-panel rounded-3xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="p-4 font-bold">Event Details</th>
              <th className="p-4 font-bold">Organizer</th>
              <th className="p-4 font-bold">Verification</th>
              <th className="p-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/50">
            {events.map(e => (
              <tr key={e._id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{e.title}</p>
                  <p className="text-sm text-slate-500">{e.sport} • {new Date(e.date).toLocaleDateString()}</p>
                </td>
                <td className="p-4 text-sm text-slate-600">{e.organizer?.name || 'Unknown'}</td>
                <td className="p-4">
                  <select
                    value={e.verificationStatus || 'Pending'}
                    onChange={(evt) => handleEventVerification(e._id, evt.target.value)}
                    className={`text-sm rounded-lg p-1 font-bold ${e.verificationStatus === 'Approved' ? 'bg-green-50 text-green-700' : e.verificationStatus === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td className="p-4">
                  <button onClick={() => handleDeleteEvent(e._id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="py-8 animate-[fadeIn_0.5s_ease-out] flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="lg:w-64 shrink-0">
        <div className="glass-panel p-6 rounded-3xl sticky top-24">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🛡️</span> Admin Panel
          </h2>
          <nav className="flex flex-col gap-2">
            {['dashboard', 'users', 'events', 'opportunities'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'opportunities' && (
              <div>
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-slate-800">Opportunity Management</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                      {showCreateForm ? 'Cancel' : 'Create Manually'}
                    </button>
                  </div>
                </div>

                {showCreateForm && (
                  <form onSubmit={handleCreateOpportunity} className="glass-panel p-6 rounded-3xl mb-8 bg-slate-50 border border-slate-200">
                    <h3 className="text-lg font-bold mb-4">Create New Opportunity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input required type="text" placeholder="Title" value={newOpp.title} onChange={e => setNewOpp({ ...newOpp, title: e.target.value })} className="p-3 rounded-lg border border-slate-200" />
                      <select value={newOpp.type} onChange={e => setNewOpp({ ...newOpp, type: e.target.value })} className="p-3 rounded-lg border border-slate-200">
                        <option value="Scholarship">Scholarship</option>
                        <option value="Event">Event</option>
                        <option value="Training">Training</option>
                      </select>
                      <input required type="text" placeholder="Sport" value={newOpp.sport} onChange={e => setNewOpp({ ...newOpp, sport: e.target.value })} className="p-3 rounded-lg border border-slate-200" />
                      <input required type="number" placeholder="Min Score" value={newOpp.minScore} onChange={e => setNewOpp({ ...newOpp, minScore: Number(e.target.value) })} className="p-3 rounded-lg border border-slate-200" />
                      <input required type="number" placeholder="Min Age" value={newOpp.targetAgeMin} onChange={e => setNewOpp({ ...newOpp, targetAgeMin: Number(e.target.value) })} className="p-3 rounded-lg border border-slate-200" />
                      <input required type="number" placeholder="Max Age" value={newOpp.targetAgeMax} onChange={e => setNewOpp({ ...newOpp, targetAgeMax: Number(e.target.value) })} className="p-3 rounded-lg border border-slate-200" />
                    </div>
                    <textarea placeholder="Description" value={newOpp.description} onChange={e => setNewOpp({ ...newOpp, description: e.target.value })} className="w-full p-3 rounded-lg border border-slate-200 mb-4 h-24"></textarea>
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700">Save Opportunity</button>
                  </form>
                )}
                <div className="glass-panel rounded-3xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="p-4 font-bold">Title & Type</th>
                        <th className="p-4 font-bold">Requirements</th>
                        <th className="p-4 font-bold">Source & Status</th>
                        <th className="p-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white/50">
                      {opportunities.map(o => (
                        <tr key={o._id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <p className="font-bold text-slate-800">
                              {o.link ? <a href={o.link} target="_blank" rel="noreferrer" className="hover:underline">{o.title}</a> : o.title}
                            </p>
                            <p className="text-sm text-slate-500">{o.type} • {o.sport}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-slate-700">Min Score: {o.minScore}</p>
                            <p className="text-sm text-slate-500">Age: {o.targetAgeMin} - {o.targetAgeMax === 100 ? 'Any' : o.targetAgeMax}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-slate-500 mb-1">{o.source}</p>
                            <select
                              value={o.status || 'Active'}
                              onChange={(e) => handleUpdateOpportunityStatus(o._id, e.target.value)}
                              className={`text-sm rounded-lg p-1 font-bold ${o.status === 'Active' || o.status === 'Verified' ? 'bg-green-50 text-green-700' :
                                o.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Pending">Pending</option>
                              <option value="Verified">Verified</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button onClick={() => handleDeleteOpportunity(o._id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {opportunities.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-slate-500 font-bold">
                            No opportunities found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
