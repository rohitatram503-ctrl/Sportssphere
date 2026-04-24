import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  const [score, setScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [orgStats, setOrgStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (role === 'Athlete') {
          const scoreRes = await api.get(`/athletes/${userId}/score`);
          setScore(scoreRes.data.score);
          const recRes = await api.get(`/athletes/${userId}/recommendations`);
          setRecommendations(recRes.data);
        } else if (role === 'Organizer' || role === 'Admin') {
          const statsRes = await api.get('/events/organizer/stats');
          setOrgStats(statsRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [role, userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8 animate-[fadeIn_0.6s_ease-out]">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2 uppercase tracking-tight">
            Dashboard <span className="text-[#0ea5e9]">Overview</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Welcome back, <span className="text-[#f97316] font-bold">{role}</span></p>
        </div>
      </div>

      {role === 'Athlete' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="sport-card sport-card-blue p-8 h-full flex flex-col justify-center animate-slide-up">
              <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-widest text-center">Performance Rating</h2>

              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                    <circle cx="96" cy="96" r="88" stroke="#0ea5e9" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - score)} className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="text-center">
                    <span className="stat-value text-slate-800">{(score * 100).toFixed(0)}</span>
                    <span className="text-2xl text-[#0ea5e9] font-bold">%</span>
                  </div>
                </div>

                <div className="mt-8 w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-500 uppercase text-xs tracking-wider">Base Score</span>
                    <span className="text-[#0ea5e9] text-lg">{score.toFixed(2)} / 1.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="sport-card sport-card-orange p-8 h-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Matched Opportunities</h2>
                <span className="bg-[#f97316] text-white py-1 px-4 rounded-full text-sm font-black shadow-md">{recommendations.length}</span>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={rec._id} className="group p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f97316] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#f97316] transition-colors">
                          {rec.link ? <a href={rec.link} target="_blank" rel="noreferrer">{rec.title}</a> : rec.title}
                        </h3>
                        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">{rec.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs font-black text-white bg-[#0f172a] px-3 py-1 rounded-full uppercase">🏆 {rec.sport}</span>
                        <span className="text-xs font-black text-white bg-[#22c55e] px-3 py-1 rounded-full uppercase">✓ Eligible</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">{rec.description}</p>

                      {rec.deadline && (
                        <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-xs font-black text-[#ea580c] uppercase">
                            ⏳ Deadline: {new Date(rec.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">No recommendations yet</h3>
                  <p className="text-slate-500 max-w-sm">Participate in more events and improve your score to unlock exclusive scholarships.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(role === 'Organizer' || role === 'Admin') && orgStats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="sport-card sport-card-blue p-6 text-center animate-slide-up">
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Total Events</h3>
              <p className="text-5xl font-black text-slate-800">{orgStats.totalEvents}</p>
            </div>
            <div className="sport-card sport-card-orange p-6 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Upcoming</h3>
              <p className="text-5xl font-black text-[#f97316]">{orgStats.upcomingEvents}</p>
            </div>
            <div className="sport-card sport-card-green p-6 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Completed</h3>
              <p className="text-5xl font-black text-[#22c55e]">{orgStats.completedEvents}</p>
            </div>
            <div className="sport-card p-6 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Participants</h3>
              <p className="text-5xl font-black text-slate-800">{orgStats.totalParticipants}</p>
            </div>
          </div>

          <div className="sport-card p-10 bg-[#0f172a] text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-black uppercase tracking-tight">Quick Actions</h2>
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl text-lg">Manage your events, approve participant registrations, and input final results which automatically recalculate athlete scores.</p>
            <div className="flex gap-4">
              <a href="/events" className="btn-sport-primary">
                Manage Events
              </a>
              {role === 'Organizer' && (
                <a href="/performance" className="btn-sport-accent">
                  Update Performance
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
