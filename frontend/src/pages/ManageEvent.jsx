import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ManageEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', sport: '', date: '', time: '', location: '', maxParticipants: '', eligibility: '', description: '' });

  const fetchEventDetails = async () => {
    try {
      // Find event specifically, since we only have getEvents we can just filter
      const { data: allEvents } = await api.get('/events');
      const foundEvent = allEvents.find(e => e._id === id);
      setEvent(foundEvent);
      if (foundEvent) {
        setEditForm({
          title: foundEvent.title || '',
          sport: foundEvent.sport || '',
          date: foundEvent.date ? new Date(foundEvent.date).toISOString().split('T')[0] : '',
          time: foundEvent.time || '',
          location: foundEvent.location || '',
          maxParticipants: foundEvent.maxParticipants || '',
          eligibility: foundEvent.eligibility || '',
          description: foundEvent.description || ''
        });
      }

      const { data: parts } = await api.get(`/events/${id}/participants`);
      setParticipants(parts);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleUpdateEvent = async (updates) => {
    try {
      const { data } = await api.put(`/events/${id}`, updates);
      setEvent(data);
      alert('Event updated!');
      setIsEditingDetails(false);
    } catch (error) {
      alert('Failed to update event');
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    handleUpdateEvent(editForm);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleParticipantStatus = async (participationId, status) => {
    try {
      await api.put(`/events/participations/${participationId}/status`, { status });
      fetchEventDetails();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleRemoveParticipant = async (participationId) => {
    if (window.confirm('Are you sure you want to permanently delete this registration?')) {
      try {
        await api.delete(`/events/participations/${participationId}`);
        fetchEventDetails();
      } catch (error) {
        alert('Failed to remove participant: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleResultUpdate = async (athleteId, result, rank) => {
    try {
      await api.put(`/events/${id}/results`, { athleteId, result, rank: Number(rank) || null });
      fetchEventDetails();
    } catch (error) {
      alert(`Failed to update result: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div></div>;
  if (!event) return <div className="text-center p-20 text-xl font-bold">Event not found</div>;

  return (
    <div className="py-8 animate-[fadeIn_0.5s_ease-out]">
      <button onClick={() => navigate('/events')} className="mb-6 text-indigo-600 hover:text-indigo-800 font-bold flex items-center">
        ← Back to Events
      </button>

      <div className="glass-panel p-8 rounded-3xl mb-8 border-t-4 border-indigo-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{event.title}</h1>
            <p className="text-slate-500">Manage your event settings, participant approvals, and match results.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <select
              value={event.status}
              onChange={(e) => handleUpdateEvent({ status: e.target.value })}
              disabled={event.status === 'Completed'}
              className="bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => handleUpdateEvent({ registrationsOpen: !event.registrationsOpen })}
              disabled={event.status === 'Completed'}
              className={`py-2 px-4 rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${event.registrationsOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {event.registrationsOpen ? 'Close Registrations' : 'Open Registrations'}
            </button>
            <button
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              disabled={event.status === 'Completed'}
              className="py-2 px-4 rounded-xl font-bold text-white transition-colors bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditingDetails ? 'Cancel Edit' : 'Edit Details'}
            </button>
          </div>
        </div>

        {isEditingDetails && (
          <div className="mt-6 border-t border-slate-200 pt-6 animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Update Event Details</h2>
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700">Title</label>
                <input required type="text" name="title" value={editForm.title} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Sport</label>
                <select required name="sport" value={editForm.sport} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                  <option value="" disabled>Select Sport...</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Badminton">Badminton</option>
                  <option value="MMA">MMA</option>
                  <option value="Boxing">Boxing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Date</label>
                <input required type="date" name="date" value={editForm.date} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Time</label>
                <input type="time" name="time" value={editForm.time} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Location</label>
                <input required type="text" name="location" value={editForm.location} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">
                  {event.participationType === 'Team' ? 'Maximum Teams' : 'Max Participants'}
                </label>
                <input type="number" name="maxParticipants" value={editForm.maxParticipants} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700">Eligibility</label>
                <input type="text" name="eligibility" value={editForm.eligibility} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700">Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} className="w-full p-2 border border-slate-300 rounded-lg h-20"></textarea>
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-emerald-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="glass-panel p-8 rounded-3xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Registered Participants ({participants.length})</h2>

        {participants.length === 0 ? (
          <p className="text-slate-500 text-center py-10">No athletes have registered for this event yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
                  <th className="p-4 font-bold rounded-tl-xl">Athlete</th>
                  <th className="p-4 font-bold">Details</th>
                  <th className="p-4 font-bold">Score</th>
                  <th className="p-4 font-bold">Registration</th>
                  <th className="p-4 font-bold rounded-tr-xl">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{p.athlete.name}</div>
                      <div className="text-sm text-slate-500">{p.athlete.email}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div>Sport: {p.athlete.sport || 'N/A'}</div>
                      <div>Age: {p.athlete.age || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-xs">
                        {(p.athlete.performanceScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-4">
                      {p.status === 'Pending' ? (
                        <div className="flex gap-2">
                          {event.status !== 'Completed' && (
                            <>
                              <button onClick={() => handleParticipantStatus(p._id, 'Approved')} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200">Approve</button>
                              <button onClick={() => handleParticipantStatus(p._id, 'Rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200">Reject</button>
                            </>
                          )}
                          {event.status === 'Completed' && <span className="text-xs text-slate-500 font-bold">Pending</span>}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 items-start">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.status}
                          </span>
                          {p.status === 'Approved' && event.status !== 'Completed' && (
                            <button onClick={() => handleParticipantStatus(p._id, 'Rejected')} className="text-xs text-amber-600 hover:text-amber-800 font-bold underline">Disapprove</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {p.status === 'Approved' && event.status === 'Completed' && (
                        <div className="flex gap-2 items-center mb-2">
                          <select
                            value={p.result}
                            onChange={(e) => handleResultUpdate(p.athlete._id, e.target.value, p.rank)}
                            className="bg-white border border-slate-300 text-slate-700 text-sm py-1 px-2 rounded focus:ring-indigo-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Win">Win</option>
                            <option value="Loss">Loss</option>
                            <option value="Draw">Draw</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Rank"
                            value={p.rank || ''}
                            onChange={(e) => handleResultUpdate(p.athlete._id, p.result, e.target.value)}
                            onBlur={(e) => handleResultUpdate(p.athlete._id, p.result, e.target.value)}
                            className="w-16 border border-slate-300 text-sm py-1 px-2 rounded"
                          />
                        </div>
                      )}
                      {p.status === 'Approved' && event.status !== 'Completed' && (
                        <div className="text-xs text-slate-400 font-bold mb-2">Event not completed</div>
                      )}
                      {event.status !== 'Completed' && (
                        <button onClick={() => handleRemoveParticipant(p._id)} className="text-xs text-red-600 hover:text-red-800 font-bold underline">Delete Registration</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvent;
