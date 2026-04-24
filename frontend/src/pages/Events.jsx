import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState({}); // eventId -> teamId
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', sport: '', date: '', time: '', location: '', maxParticipants: '', eligibility: '', description: '', participationType: 'Individual' });
  const [isLoading, setIsLoading] = useState(true);
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const endpoint = (role === 'Organizer') ? `/events?organizerId=${userId}` : '/events';
      const { data } = await api.get(endpoint);
      setEvents(data);

      if (role === 'Athlete') {
        const teamsRes = await api.get('/teams');
        setTeams(teamsRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [role, userId]);

  const handleTeamSelection = (eventId, teamId) => {
    setSelectedTeams(prev => ({ ...prev, [eventId]: teamId }));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      setShowCreate(false);
      setFormData({ title: '', sport: '', date: '', time: '', location: '', maxParticipants: '', eligibility: '', description: '', participationType: 'Individual' });
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${id}`);
        fetchEvents();
      } catch (error) {
        alert('Failed to delete event');
      }
    }
  };

  const handleRegister = async (event) => {
    try {
      const payload = {};
      if (event.participationType === 'Team') {
        const teamId = selectedTeams[event._id];
        if (!teamId) {
          alert('Please select a team to register for this team event.');
          return;
        }
        payload.teamId = teamId;
      }

      await api.post(`/events/${event._id}/register`, payload);
      alert('Successfully registered!');
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="py-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">{(role === 'Organizer') ? 'Manage ' : 'Explore '}<span className="premium-gradient-text">Events</span></h1>
          <p className="text-slate-500 text-lg">{(role === 'Organizer') ? 'Create, edit, and oversee your tournaments.' : 'Discover and participate in upcoming sports tournaments globally.'}</p>
        </div>

        {role === 'Organizer' && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 hover:-translate-y-1 ${showCreate ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30'}`}
          >
            {showCreate ? 'Cancel Creation' : '+ Create New Event'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="glass-panel p-8 rounded-3xl mb-10 animate-[fadeIn_0.3s_ease-out] border border-indigo-100">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Event Details</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Event Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Sport Category</label>
              <select name="sport" value={formData.sport} onChange={handleChange} required className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                <option value="" disabled>Select Sport...</option>
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Badminton">Badminton</option>
                <option value="MMA">MMA</option>
                <option value="Boxing">Boxing</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">
                {formData.participationType === 'Team' ? 'Maximum Teams' : 'Max Participants'}
              </label>
              <input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Participation Type</label>
              <select name="participationType" value={formData.participationType} onChange={handleChange} className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                <option value="Individual">Individual</option>
                <option value="Team">Team</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Eligibility Criteria</label>
              <input type="text" name="eligibility" value={formData.eligibility} onChange={handleChange} className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-semibold text-slate-600 ml-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <button type="submit" className="md:col-span-2 mt-2 bg-slate-800 text-white p-4 rounded-xl font-bold hover:bg-slate-900 shadow-lg">
              Publish Event to Platform
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <div key={event._id} className="glass-panel bg-white/80 rounded-3xl overflow-hidden hover-scale group flex flex-col border border-slate-100" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 w-full opacity-70 group-hover:opacity-100 transition-opacity"></div>

              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase">{event.sport}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.participationType === 'Team' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {event.participationType || 'Individual'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : event.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {event.status || 'Upcoming'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-4">{event.title}</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start text-slate-600"><span className="mr-3">📅</span><span className="text-sm">{new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}</span></div>
                  <div className="flex items-start text-slate-600"><span className="mr-3">📍</span><span className="text-sm">{event.location}</span></div>
                  <div className="flex items-start text-slate-600">
                    <span className="mr-3">👥</span>
                    <span className="text-sm">
                      {event.registeredCount !== undefined ? `${event.registeredCount} / ${event.maxParticipants || '∞'}` : `Max: ${event.maxParticipants || 'Unlimited'}`}
                      {event.participationType === 'Team' ? ' Teams' : ' Athletes'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                {role === 'Athlete' ? (
                  <>
                    {event.participationType === 'Team' && event.registrationsOpen && (
                      <div className="mb-2">
                        <select
                          value={selectedTeams[event._id] || ''}
                          onChange={(e) => handleTeamSelection(event._id, e.target.value)}
                          className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Team --</option>
                          {teams.filter(t => t.sport.toLowerCase() === event.sport.toLowerCase()).map(t => {
                            const limits = { 'football': { min: 11, max: 16 }, 'cricket': { min: 11, max: 15 }, 'badminton': { min: 1, max: 2 }, 'mma': { min: 1, max: 1 }, 'boxing': { min: 1, max: 1 } };
                            const rule = limits[event.sport.toLowerCase()];
                            const isValid = rule ? (t.players.length >= rule.min && t.players.length <= rule.max) : true;
                            return (
                              <option key={t._id} value={t._id} disabled={!isValid}>
                                {t.name} (Size: {t.players.length}{rule ? ` / limits: ${rule.min}-${rule.max}` : ''}) {isValid ? '' : '- INELIGIBLE'}
                              </option>
                            );
                          })}
                        </select>
                        {selectedTeams[event._id] && (
                          <p className="text-xs text-slate-500 mt-1 ml-1">
                            {(() => {
                              const t = teams.find(team => team._id === selectedTeams[event._id]);
                              const rule = { 'football': { min: 11, max: 16 }, 'cricket': { min: 11, max: 15 }, 'badminton': { min: 1, max: 2 }, 'mma': { min: 1, max: 1 }, 'boxing': { min: 1, max: 1 } }[event.sport.toLowerCase()];
                              if (t && rule) return `Team Size: ${t.players.length} players. Limit: ${rule.min} to ${rule.max}.`;
                              return '';
                            })()}
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleRegister(event)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                      disabled={!event.registrationsOpen || event.isFull || (event.participationType === 'Team' && !selectedTeams[event._id])}
                    >
                      {!event.registrationsOpen ? 'Registrations Closed' : event.isFull ? 'Tournament Full' : 'Register Now'}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Link to={`/events/${event._id}/manage`} className="flex-1 text-center py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm">
                      Manage Event
                    </Link>
                    <button onClick={() => handleDelete(event._id)} className="py-3 px-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
