import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'Athlete', age: '', interestedSports: [], experience: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSportToggle = (sport) => {
    setFormData(prev => {
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
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data._id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="glass-panel p-10 rounded-3xl w-full max-w-lg animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold premium-gradient-text mb-2">Join SportsSphere</h2>
          <p className="text-slate-500">Create your account and start your journey</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 border border-red-100 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="john@example.com" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Account Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <option value="Athlete">Athlete</option>
                <option value="Organizer">Event Organizer</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>

          {formData.role === 'Athlete' && (
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Athlete Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-4 py-2 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="e.g. 24" />
                </div>
                <div className="col-span-1 md:col-span-2 mt-2 border-t border-indigo-100 pt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Interested Sports</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Football', 'Cricket', 'Badminton', 'MMA', 'Boxing'].map(sport => (
                      <label key={sport} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${formData.interestedSports.includes(sport) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 hover:border-indigo-300 text-slate-700'}`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.interestedSports.includes(sport)}
                          onChange={() => handleSportToggle(sport)}
                        />
                        <span className="text-sm font-bold w-full text-center">{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Experience Level</label>
                <input type="text" name="experience" value={formData.experience} onChange={handleChange} className="w-full px-4 py-2 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="e.g. 5 years, Semi-Pro" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:scale-100"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-indigo-700 transition-colors">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
