import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Teams = () => {
  const [activeTab, setActiveTab] = useState('myTeams');
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', sport: '', players: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [viewingProfile, setViewingProfile] = useState(null);

  const userId = localStorage.getItem('userId');

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/teams');
      setTeams(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const { data } = await api.get('/teams/all');
      setAllTeams(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAthletes = async () => {
    try {
      const { data } = await api.get('/athletes');
      setAthletes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchAllTeams(), fetchAthletes()]);
      setLoading(false);
    };
    initData();
  }, []);

  const handlePlayerToggle = (athleteId) => {
    setNewTeam(prev => {
      const isSelected = prev.players.includes(athleteId);
      if (isSelected) {
        return { ...prev, players: prev.players.filter(id => id !== athleteId) };
      } else {
        return { ...prev, players: [...prev.players, athleteId] };
      }
    });
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', newTeam);
      setMessage('Team created successfully!');
      setNewTeam({ name: '', sport: '', players: [] });
      setShowCreateForm(false);
      fetchTeams();
      fetchAllTeams();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleRequestJoin = async (teamId) => {
    try {
      await api.post(`/teams/${teamId}/request`);
      alert('Join request sent successfully!');
      fetchAllTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleApproveRequest = async (teamId, reqUserId) => {
    try {
      await api.post(`/teams/${teamId}/approve`, { userId: reqUserId });
      alert('Request approved!');
      fetchTeams();
      fetchAllTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleRejectRequest = async (teamId, reqUserId) => {
    try {
      await api.post(`/teams/${teamId}/reject`, { userId: reqUserId });
      alert('Request rejected');
      fetchTeams();
      fetchAllTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleRemovePlayer = async (teamId, reqUserId) => {
    if (!window.confirm('Are you sure you want to remove this player from the team?')) return;
    try {
      await api.delete(`/teams/${teamId}/players/${reqUserId}`);
      alert('Player removed');
      fetchTeams();
      fetchAllTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove player');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team entirely? This cannot be undone.')) return;
    try {
      await api.delete(`/teams/${teamId}`);
      alert('Team deleted successfully');
      fetchTeams();
      fetchAllTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete team');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;

  const discoverableTeams = allTeams.filter(t => !t.players.some(p => p._id === userId));

  return (
    <div className="py-8 max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Team <span className="premium-gradient-text">Hub</span></h1>
          <p className="text-slate-500">Create, manage, and discover sports teams</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
        >
          {showCreateForm ? 'Cancel' : '+ Create Team'}
        </button>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('myTeams')}
          className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'myTeams' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Teams
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'discover' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Discover Teams
        </button>
      </div>

      {message && (
        <div className="p-4 mb-6 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="glass-panel p-8 rounded-3xl mb-8 shadow-xl bg-white relative overflow-hidden">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Team Name</label>
                <input required type="text" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sport</label>
                <select required value={newTeam.sport} onChange={e => setNewTeam({ ...newTeam, sport: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="" disabled>Select a sport...</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Badminton">Badminton</option>
                  <option value="MMA">MMA</option>
                  <option value="Boxing">Boxing</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Teammates Directly</label>
              {!newTeam.sport ? (
                <p className="text-sm text-slate-500 italic">Please select a sport first to see available athletes.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {athletes
                    .filter(a => a._id !== userId && (!a.sport || a.sport === newTeam.sport))
                    .map(a => (
                      <label key={a._id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${newTeam.players.includes(a._id) ? 'bg-indigo-100 border border-indigo-300' : 'bg-white border border-slate-200 hover:border-indigo-300'}`}>
                        <input type="checkbox" className="mr-3 w-4 h-4 text-indigo-600 rounded" checked={newTeam.players.includes(a._id)} onChange={() => handlePlayerToggle(a._id)} />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{a.name}</div>
                          <div className="text-xs text-slate-500">{a.email}</div>
                          <div className="text-xs font-bold text-indigo-500 mt-1">{a.sport || 'Any'}</div>
                        </div>
                      </label>
                    ))}
                  {athletes.filter(a => a._id !== userId && (!a.sport || a.sport === newTeam.sport)).length === 0 && (
                    <p className="text-sm text-slate-500 col-span-3">No other athletes found for {newTeam.sport}.</p>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
              Save Team
            </button>
          </form>
        </div>
      )}

      {activeTab === 'myTeams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-500 font-bold bg-white rounded-3xl border border-slate-100 shadow-sm">
              You are not part of any teams yet. Create one or request to join from the Discover tab!
            </div>
          ) : (
            teams.map(team => (
              <div key={team._id} className="glass-panel p-6 rounded-3xl shadow-sm bg-white border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{team.name}</h3>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{team.sport}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Captain: {team.captain?._id === userId ? 'You' : team.captain?.name}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Roster ({team.players.length} / {team.maxPlayers || '∞'})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {team.players.map(p => (
                      <div key={p._id} className="group relative">
                        <button
                          onClick={() => setViewingProfile(p)}
                          className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors flex items-center gap-1"
                        >
                          {p.name} {p._id === team.captain?._id && '👑'}
                        </button>
                        {team.captain?._id === userId && p._id !== userId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemovePlayer(team._id, p._id); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600"
                            title="Remove Player"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join Requests Section (Only visible to Captain) */}
                {team.captain?._id === userId && team.joinRequests && team.joinRequests.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                      Pending Join Requests ({team.joinRequests.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {team.joinRequests.map(reqUser => (
                        <div key={reqUser._id} className="flex justify-between items-center bg-amber-50/50 border border-amber-100 p-2 rounded-xl">
                          <div>
                            <div className="text-sm font-bold text-slate-800">{reqUser.name}</div>
                            <div className="text-xs text-slate-500">{reqUser.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setViewingProfile(reqUser)} className="bg-blue-100 text-blue-700 hover:bg-blue-500 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                              View Profile
                            </button>
                            <button
                              onClick={() => handleApproveRequest(team._id, reqUser._id)}
                              disabled={team.players.length >= (team.maxPlayers || 999)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${team.players.length >= (team.maxPlayers || 999) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white'}`}
                              title={team.players.length >= (team.maxPlayers || 999) ? 'Team is full' : ''}
                            >
                              Approve
                            </button>
                            <button onClick={() => handleRejectRequest(team._id, reqUser._id)} className="bg-red-100 text-red-700 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Captain Management Footer */}
                {team.captain?._id === userId && (
                  <div className="mt-auto pt-4 flex justify-end">
                    <button
                      onClick={() => handleDeleteTeam(team._id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      🗑️ Delete Team
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {discoverableTeams.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-500 font-bold bg-white rounded-3xl border border-slate-100 shadow-sm">
              No new teams available to join at the moment.
            </div>
          ) : (
            discoverableTeams.map(team => {
              const hasRequested = team.joinRequests?.some(r => r === userId || r._id === userId);

              return (
                <div key={team._id} className="glass-panel p-6 rounded-3xl shadow-sm bg-white border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-800">{team.name}</h3>
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{team.sport}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        Captain: {team.captain?.name}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-600 mb-6">Current Roster Size: <span className={team.players.length >= (team.maxPlayers || 999) ? 'text-red-600 font-black' : ''}>{team.players.length} / {team.maxPlayers || '∞'}</span></p>
                  </div>

                  <button
                    onClick={() => handleRequestJoin(team._id)}
                    disabled={hasRequested || team.players.length >= (team.maxPlayers || 999)}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${hasRequested || team.players.length >= (team.maxPlayers || 999) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:shadow-md'}`}
                  >
                    {hasRequested ? 'Request Pending...' : team.players.length >= (team.maxPlayers || 999) ? 'Team Full' : 'Request to Join'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Profile View Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setViewingProfile(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Athlete Profile</h2>
            <div className="space-y-4">
              <div><p className="text-xs font-bold uppercase text-slate-400">Name</p><p className="text-lg font-bold text-slate-800">{viewingProfile.name}</p></div>
              <div><p className="text-xs font-bold uppercase text-slate-400">Email</p><p className="text-slate-600 font-medium">{viewingProfile.email}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold uppercase text-slate-400">Sport</p><p className="text-slate-800 font-bold">{viewingProfile.sport || 'N/A'}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Age</p><p className="text-slate-800 font-bold">{viewingProfile.age || 'N/A'}</p></div>
              </div>
              <div><p className="text-xs font-bold uppercase text-slate-400">Experience</p><p className="text-slate-800 font-medium">{viewingProfile.experience || 'Not specified'}</p></div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Overall Performance Score</p>
                <div className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-2xl px-4 py-2 rounded-xl shadow-md">
                  {((viewingProfile.performanceScore || 0) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewingProfile(null)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
