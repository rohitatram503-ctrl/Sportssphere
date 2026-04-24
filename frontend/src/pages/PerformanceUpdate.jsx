import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SPORTS = ['Football', 'Cricket', 'Badminton', 'MMA', 'Boxing'];
const ROLES = {
  Football: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
  Cricket: ['Batsman', 'Bowler', 'All-Rounder'],
  Badminton: [],
  MMA: [],
  Boxing: []
};

const PERFORMANCE_FIELDS = {
  Football: {
    Forward: [
      { name: 'goalsScored', label: 'Goals Scored' },
      { name: 'assists', label: 'Assists' },
      { name: 'shotsOnTarget', label: 'Shots on Target' },
      { name: 'dribblesCompleted', label: 'Dribbles Completed' }
    ],
    Midfielder: [
      { name: 'assists', label: 'Assists' },
      { name: 'passAccuracy', label: 'Pass Accuracy (%)' },
      { name: 'keyPasses', label: 'Key Passes' },
      { name: 'ballPossession', label: 'Ball Possession' }
    ],
    Defender: [
      { name: 'tackles', label: 'Tackles' },
      { name: 'interceptions', label: 'Interceptions' },
      { name: 'clearances', label: 'Clearances' },
      { name: 'blocks', label: 'Blocks' }
    ],
    Goalkeeper: [
      { name: 'saves', label: 'Saves' },
      { name: 'cleanSheets', label: 'Clean Sheets' },
      { name: 'goalsConceded', label: 'Goals Conceded' },
      { name: 'savePercentage', label: 'Save Percentage (%)' }
    ]
  },
  Cricket: {
    Batsman: [
      { name: 'runsScored', label: 'Runs Scored' },
      { name: 'battingAverage', label: 'Batting Average' },
      { name: 'strikeRate', label: 'Strike Rate' },
      { name: 'boundaries', label: 'Boundaries' },
      { name: 'matchesPlayed', label: 'Matches Played' }
    ],
    Bowler: [
      { name: 'wicketsTaken', label: 'Wickets Taken' },
      { name: 'economyRate', label: 'Economy Rate' },
      { name: 'oversBowled', label: 'Overs Bowled' },
      { name: 'bowlingAverage', label: 'Bowling Average' },
      { name: 'maidenOvers', label: 'Maiden Overs' }
    ],
    'All-Rounder': [
      { name: 'runsScored', label: 'Runs Scored' },
      { name: 'strikeRate', label: 'Strike Rate' },
      { name: 'wicketsTaken', label: 'Wickets Taken' },
      { name: 'economyRate', label: 'Economy Rate' }
    ]
  },
  Badminton: {
    default: [
      { name: 'matchesWon', label: 'Matches Won' },
      { name: 'smashAccuracy', label: 'Smash Accuracy (%)' },
      { name: 'successfulReturns', label: 'Successful Returns (%)' },
      { name: 'staminaScore', label: 'Stamina Score' }
    ]
  },
  MMA: {
    default: [
      { name: 'strikesLanded', label: 'Strikes Landed' },
      { name: 'takedowns', label: 'Takedowns' },
      { name: 'submissionAttempts', label: 'Submission Attempts' },
      { name: 'wins', label: 'Wins' },
      { name: 'losses', label: 'Losses' }
    ]
  },
  Boxing: {
    default: [
      { name: 'punchAccuracy', label: 'Punch Accuracy (%)' },
      { name: 'knockouts', label: 'Knockouts' },
      { name: 'defenseRating', label: 'Defense Rating' },
      { name: 'roundsPlayed', label: 'Rounds Played' }
    ]
  }
};

const PerformanceUpdate = () => {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [athletes, setAthletes] = useState([]);

  const [sport, setSport] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [role, setRole] = useState('');
  const [performanceData, setPerformanceData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch all events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 2. When an event is selected, fetch its participants
  useEffect(() => {
    if (!selectedEvent) {
      setAthletes([]);
      return;
    }
    const fetchParticipants = async () => {
      try {
        const { data } = await api.get(`/events/${selectedEvent}/participants`);
        // Filter only approved participants
        const approved = data.filter(p => p.status === 'Approved');
        // Extract athletes and inject teamName, rank, and result if they exist
        const eventAthletes = approved
          .map(p => p.athlete ? { ...p.athlete, teamName: p.team?.name, rank: p.rank, result: p.result } : null)
          .filter(Boolean);
        setAthletes(eventAthletes);
      } catch (error) {
        console.error("Error fetching participants", error);
        setAthletes([]);
      }
    };
    fetchParticipants();
  }, [selectedEvent]);

  // 3. When athlete and event are selected, check for existing performance
  useEffect(() => {
    if (!selectedAthlete || !selectedEvent) {
      setIsEditing(false);
      setPerformanceData({});
      return;
    }
    const checkExistingPerformance = async () => {
      try {
        const { data } = await api.get(`/athletes/${selectedAthlete}/performances?eventId=${selectedEvent}`);
        if (data && data.length > 0) {
          const record = data[0];
          setIsEditing(true);
          setRole(record.role || '');
          setPerformanceData(record.performanceData || {});
          setMessage('Existing performance record found. You can edit it below.');
        } else {
          setIsEditing(false);
          setPerformanceData({});
          setMessage('');
        }
      } catch (error) {
        console.error("Error checking existing performance", error);
      }
    };
    checkExistingPerformance();
  }, [selectedAthlete, selectedEvent]);

  const handleSportChange = (e) => {
    setSport(e.target.value);
    setSelectedEvent('');
    setSelectedAthlete('');
    setRole('');
    setPerformanceData({});
    setIsEditing(false);
  };

  const handleEventChange = (e) => {
    setSelectedEvent(e.target.value);
    setSelectedAthlete('');
    setRole('');
    setPerformanceData({});
    setIsEditing(false);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setPerformanceData({});
  };

  const handleFieldChange = (name, value) => {
    setPerformanceData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAthlete || !sport || !selectedEvent) {
      setMessage('Please select a sport, an event, and an athlete.');
      return;
    }
    try {
      const res = await api.post(`/athletes/${selectedAthlete}/performance`, {
        sport,
        role,
        performanceData,
        eventId: selectedEvent
      });
      setMessage(isEditing ? `Success! Performance updated. New score: ${(res.data.score * 100).toFixed(0)}` : `Success! Performance added. New score: ${(res.data.score * 100).toFixed(0)}`);
      // Reset form
      setSport('');
      setSelectedEvent('');
      setSelectedAthlete('');
      setRole('');
      setPerformanceData({});
      setIsEditing(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save performance');
    }
  };

  const getActiveFields = () => {
    if (!sport) return [];
    if (ROLES[sport].length > 0) {
      if (!role) return [];
      return PERFORMANCE_FIELDS[sport][role] || [];
    }
    return PERFORMANCE_FIELDS[sport].default || [];
  };

  const activeFields = getActiveFields();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8 animate-[fadeIn_0.5s_ease-out] max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
          Dynamic Performance <span className="premium-gradient-text">Updater</span>
        </h1>
        <p className="text-slate-500">
          Update an athlete's performance dynamically based on sport and role/position. The system will recalculate their global score instantly.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl bg-white shadow-xl relative overflow-hidden">
        {message && (
          <div className={`p-4 mb-6 rounded-xl font-bold ${message.includes('Success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">1. Select Sport</label>
              <select
                value={sport}
                onChange={handleSportChange}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              >
                <option value="">-- Choose Sport --</option>
                {SPORTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">2. Select Event</label>
              <select
                value={selectedEvent}
                onChange={handleEventChange}
                disabled={!sport}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                required
              >
                <option value="">-- Choose Event --</option>
                {events
                  .filter(e => e.sport === sport)
                  .map(e => (
                    <option key={e._id} value={e._id} disabled={e.status !== 'Completed'}>
                      {e.title} {e.status !== 'Completed' ? `(${e.status} - Cannot Update Yet)` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">3. Search & Select Athlete</label>
              <input
                type="text"
                placeholder="Filter by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                disabled={!selectedEvent}
                className="w-full p-2 mb-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm disabled:opacity-50"
              />
              <select
                value={selectedAthlete}
                onChange={(e) => setSelectedAthlete(e.target.value)}
                disabled={!selectedEvent}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                required
              >
                <option value="">-- Choose Approved Athlete --</option>
                {athletes
                  .filter(a => a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(a => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.email}) {a.teamName ? `[Team: ${a.teamName}]` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {sport && selectedAthlete && ROLES[sport]?.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">4. Select Role / Position</label>
                <div className="flex gap-3 flex-wrap">
                  {ROLES[sport].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${role === r
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeFields.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="text-indigo-600">⚡</span> Performance Parameters
                {athletes.find(a => a._id === selectedAthlete)?.rank && (
                  <span className="ml-4 text-sm font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                    🏆 Event Rank: {athletes.find(a => a._id === selectedAthlete).rank}
                  </span>
                )}
                {athletes.find(a => a._id === selectedAthlete)?.result && athletes.find(a => a._id === selectedAthlete).result !== 'Pending' && (
                  <span className={`ml-2 text-sm font-bold px-3 py-1 rounded-full ${athletes.find(a => a._id === selectedAthlete).result === 'Win' ? 'bg-green-100 text-green-700' : athletes.find(a => a._id === selectedAthlete).result === 'Loss' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {athletes.find(a => a._id === selectedAthlete).result}
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {activeFields.map(field => (
                  <div key={field.name} className="relative group">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{field.label}</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={performanceData[field.name] !== undefined ? performanceData[field.name] : ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-100 bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all font-bold text-slate-800"
                      required
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={!sport || (ROLES[sport]?.length > 0 && !role)}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isEditing ? 'Edit Performance' : 'Add Performance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerformanceUpdate;
