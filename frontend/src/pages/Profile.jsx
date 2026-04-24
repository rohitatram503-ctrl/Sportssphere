import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', age: '', interestedSports: [], experience: '', performanceScore: 0 });
  const [performances, setPerformances] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [activeSportTab, setActiveSportTab] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/athletes/${userId}`);
        setProfile({
          name: data.name || '',
          age: data.age || '',
          interestedSports: data.interestedSports || [],
          experience: data.experience || '',
          performanceScore: data.performanceScore || 0
        });

        // Fetch performances
        const perfRes = await api.get(`/athletes/${userId}/performances`);
        setPerformances(perfRes.data);

        // Fetch participations
        try {
          const partRes = await api.get(`/athletes/${userId}/participations`);
          setParticipations(partRes.data);
        } catch (e) {
          console.error("Participations could not be loaded");
        }

        // Fetch insights
        try {
          const insightsRes = await api.get(`/athletes/${userId}/insights`);
          setInsights(insightsRes.data);
        } catch (e) {
          console.error("Insights could not be loaded");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSportToggle = (sport) => {
    setProfile(prev => {
      const isSelected = prev.interestedSports.includes(sport);
      if (isSelected) {
        return { ...prev, interestedSports: prev.interestedSports.filter(s => s !== sport) };
      } else {
        return { ...prev, interestedSports: [...prev.interestedSports, sport] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/athletes/${userId}`, profile);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderInsights = () => {
    if (!insights || performances.length === 0) return (
      <div className="bg-slate-50 p-8 rounded-3xl text-center text-slate-500 font-bold border border-slate-100">
        Participate in events and log performances to unlock your personalized Insight Dashboard!
      </div>
    );

    const levelColors = {
      'Elite': 'from-amber-400 to-orange-500 text-white',
      'Advanced': 'from-emerald-400 to-teal-500 text-white',
      'Intermediate': 'from-blue-400 to-indigo-500 text-white',
      'Beginner': 'from-slate-400 to-slate-500 text-white'
    };

    return (
      <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-3xl bg-gradient-to-br ${levelColors[insights.level] || levelColors.Beginner} shadow-lg relative overflow-hidden`}>
            <div className="absolute -right-6 -bottom-6 opacity-20 text-9xl">🏆</div>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-2">Overall Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{insights.overallScore}</span>
              <span className="text-xl font-bold opacity-80">/ 100</span>
            </div>
            <p className="mt-4 text-sm font-bold bg-white/20 inline-block px-3 py-1 rounded-lg backdrop-blur-sm">
              {insights.level} Level
            </p>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience</p>
              <p className="text-2xl font-black text-slate-800">{insights.experience.totalEvents} <span className="text-base text-slate-500 font-medium">Events</span></p>
              <div className="mt-4">
                <p className="text-sm font-bold text-indigo-600 mb-1">Win Rate: {insights.experience.winRate}%</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${insights.experience.winRate}%` }}></div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Trend</p>
                <p className={`text-xl font-black ${insights.trendStatus === 'Improving' ? 'text-emerald-500' : insights.trendStatus === 'Declining' ? 'text-red-500' : 'text-blue-500'}`}>
                  {insights.trendStatus === 'Improving' ? '📈 Improving' : insights.trendStatus === 'Declining' ? '📉 Declining' : '➡️ Stable'}
                </p>
              </div>
              <div className="mt-4 flex gap-1 items-end h-10 w-full">
                {insights.trend.map((score, i) => (
                  <div key={i} className="flex-1 bg-indigo-100 rounded-t-sm relative group hover:bg-indigo-300 transition-colors" style={{ height: `${Math.max(10, score)}%` }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      {score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Sport Wise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-100">
            <h3 className="font-extrabold text-slate-800 mb-4">Key Strengths</h3>
            {insights.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {insights.strengths.map(s => (
                  <span key={s} className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-sm">
                    ⚡ {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Play more matches to generate insights.</p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-800">Trophy Cabinet & Badges</h3>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {insights.badges?.length || 0} Unlocked
                </span>
              </div>

              {(!insights.badges || insights.badges.length === 0) ? (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                  <span className="text-4xl block mb-2 opacity-50">🔒</span>
                  <p className="text-sm font-bold text-slate-500">No badges unlocked yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Participate in events and win matches to earn them!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {[...insights.badges].reverse().map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0 border border-slate-100">
                        {badge.icon || '🏅'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-sm">{badge.name}</h4>
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded uppercase">{badge.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-white border border-slate-100">
            <h3 className="font-extrabold text-slate-800 mb-4">Sport-Wise Performance</h3>
            <div className="space-y-5">
              {Object.entries(insights.sportScores).map(([sport, score]) => (
                <div key={sport}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700">{sport}</span>
                    <span className="font-black text-indigo-600">{score}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${score}%` }}></div>
                  </div>
                </div>
              ))}
              {Object.keys(insights.sportScores).length === 0 && <p className="text-sm text-slate-500">No sport specific data available.</p>}
            </div>
            {insights.overallScore >= 75 ? (
              <div className="mt-6 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold text-center">
                ✅ Eligible for Advanced Events
              </div>
            ) : (
              <div className="mt-6 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-bold text-center">
                🎯 Needs Skill Development
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEditProfile = () => (
    <div className="glass-panel p-8 rounded-3xl bg-white border border-slate-100 shadow-sm animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center space-x-6 mb-8 pb-6 border-b border-slate-100">
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-bold uppercase shrink-0">
          {profile.name ? profile.name.charAt(0) : 'A'}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Edit Profile Details</h2>
          <p className="text-slate-500 mt-1 text-sm">Update your public information</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-8 font-medium border ${message.includes('success') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <div className="flex items-center">
            <span className="mr-2">{message.includes('success') ? '✓' : '⚠️'}</span>
            {message}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Full Name</label>
            <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Age</label>
            <input type="number" name="age" value={profile.age} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="space-y-2 col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-2">Interested Sports</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Football', 'Cricket', 'Badminton', 'MMA', 'Boxing'].map(sport => (
              <label key={sport} className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${profile.interestedSports.includes(sport) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={profile.interestedSports.includes(sport)}
                  onChange={() => handleSportToggle(sport)}
                />
                <span className="text-sm font-bold w-full text-center">{sport}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 flex justify-between">
            <span>Experience Summary</span>
          </label>
          <textarea name="experience" value={profile.experience} onChange={handleChange} rows="3" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
        </div>
        <div className="pt-4">
          <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );

  const renderPerformances = () => (
    <div className="mt-8 animate-[fadeIn_0.5s_ease-out]">
      {performances.length === 0 ? (
        <div className="bg-white p-6 rounded-3xl text-center text-slate-500 border border-slate-100 shadow-sm">
          No performance records available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {performances.map((perf) => (
            <div key={perf._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-3xl -z-0 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{perf.eventId?.title || 'Unknown Event'}</h4>
                    <p className="text-sm text-indigo-600 font-semibold">{perf.sport} • {perf.role || 'General'}</p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-800 font-black px-3 py-1 rounded-xl text-sm border border-indigo-200">
                    {Math.round(perf.performanceScore)} pts
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                  {perf.performanceData && Object.entries(perf.performanceData).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-slate-700 font-black">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderParticipations = () => (
    <div className="mt-8 animate-[fadeIn_0.5s_ease-out]">
      {participations.length === 0 ? (
        <div className="bg-white p-6 rounded-3xl text-center text-slate-500 border border-slate-100 shadow-sm">
          No event participation history available yet.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="p-4 font-bold">Event Details</th>
                <th className="p-4 font-bold">Registration Status</th>
                <th className="p-4 font-bold">Match Result</th>
                <th className="p-4 font-bold">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/50">
              {participations.map(p => (
                <tr key={p._id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{p.event?.title || 'Unknown Event'}</p>
                    <p className="text-sm text-slate-500">{p.event?.sport} • {p.event?.date ? new Date(p.event.date).toLocaleDateString() : 'TBD'}</p>
                    {p.team && <p className="text-xs font-bold text-indigo-500 mt-1">Team: {p.team.name}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`text-sm rounded-lg p-1.5 px-3 font-bold ${p.status === 'Approved' ? 'bg-green-50 text-green-700' :
                      p.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-bold ${p.result === 'Win' ? 'text-green-600' :
                      p.result === 'Loss' ? 'text-red-600' :
                        p.result === 'Draw' ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                      {p.result || 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 font-black text-slate-700">
                    {p.rank ? `#${p.rank}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Athlete <span className="premium-gradient-text">Profile</span></h1>
        <p className="text-slate-500">Track your progress and manage your account</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button onClick={() => setActiveTab('insights')} className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'insights' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Insights Dashboard
        </button>
        <button onClick={() => setActiveTab('participations')} className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'participations' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Event History
        </button>
        <button onClick={() => setActiveTab('performances')} className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'performances' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Raw Performances
        </button>
        <button onClick={() => setActiveTab('edit')} className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'edit' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Edit Profile
        </button>
      </div>

      {activeTab === 'insights' && renderInsights()}
      {activeTab === 'participations' && renderParticipations()}
      {activeTab === 'performances' && renderPerformances()}
      {activeTab === 'edit' && renderEditProfile()}
    </div>
  );
};

export default Profile;
