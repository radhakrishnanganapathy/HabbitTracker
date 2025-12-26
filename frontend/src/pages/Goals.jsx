import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Calendar, Clock, FileText, CheckCircle, XCircle, PlayCircle, Trash2 } from 'lucide-react';
import './Goals.css';

function Goals() {
    const [goals, setGoals] = useState([]);
    const [user, setUser] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        goal_type: 'Short Term',
        name: '',
        duration_type: 'Days',
        duration_value: 1,
        start_date: '',
        end_date: '',
        agenda: '',
        status: 'Active'
    });
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        fetchGoals(storedUser.id);
    }, [navigate]);

    const fetchGoals = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8002/users/${userId}/goals/`);
            if (response.ok) {
                const data = await response.json();
                setGoals(data);
            }
        } catch (error) {
            console.error("Error fetching goals:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}/goals/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchGoals(user.id);
                setShowForm(false);
                setFormData({
                    goal_type: 'Short Term',
                    name: '',
                    duration_type: 'Days',
                    duration_value: 1,
                    start_date: '',
                    end_date: '',
                    agenda: '',
                    status: 'Active'
                });
            }
        } catch (error) {
            console.error("Error creating goal:", error);
        }
    };

    const handleDelete = async (goalId) => {
        if (window.confirm("Are you sure you want to delete this goal?")) {
            try {
                const response = await fetch(`http://localhost:8002/goals/${goalId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchGoals(user.id);
                }
            } catch (error) {
                console.error("Error deleting goal:", error);
            }
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Active': return <PlayCircle size={18} color="#4caf50" />;
            case 'Done': return <CheckCircle size={18} color="#2196f3" />;
            case 'Drop': return <XCircle size={18} color="#f44336" />;
            default: return <Target size={18} />;
        }
    };

    return (
        <div className="goals-container">
            <div className="goals-header">
                <h2>My Goals</h2>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Close Form' : 'Add New Goal'}
                </button>
            </div>

            {showForm && (
                <div className="card goal-form-card">
                    <h3>Create New Goal</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Goal Type</label>
                                <select name="goal_type" value={formData.goal_type} onChange={handleChange}>
                                    <option value="Short Term">Short Term</option>
                                    <option value="Long Term">Long Term</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="Active">Active</option>
                                    <option value="Done">Done</option>
                                    <option value="Drop">Drop</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Goal Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Duration Value</label>
                                <input type="number" name="duration_value" value={formData.duration_value} onChange={handleChange} min="1" required />
                            </div>
                            <div className="form-group">
                                <label>Duration Type</label>
                                <select name="duration_type" value={formData.duration_type} onChange={handleChange}>
                                    <option value="Days">Days</option>
                                    <option value="Months">Months</option>
                                    <option value="Years">Years</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Agenda (Description)</label>
                            <textarea name="agenda" value={formData.agenda} onChange={handleChange} rows="3"></textarea>
                        </div>

                        <button type="submit" className="btn-primary">Save Goal</button>
                    </form>
                </div>
            )}

            <div className="goals-list">
                {goals.map(goal => (
                    <div key={goal.id} className="card goal-card">
                        <div className="goal-card-header">
                            <div className="goal-title">
                                {getStatusIcon(goal.status)}
                                <h3>{goal.name}</h3>
                            </div>
                            <span className={`goal-type ${goal.goal_type.toLowerCase().replace(' ', '-')}`}>
                                {goal.goal_type}
                            </span>
                        </div>
                        <div className="goal-details">
                            <p><strong>Duration:</strong> {goal.duration_value} {goal.duration_type}</p>
                            <p><strong>Dates:</strong> {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> {goal.status}</p>
                        </div>
                        <p className="goal-agenda">{goal.agenda}</p>
                        <button className="delete-btn" onClick={() => handleDelete(goal.id)}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Goals;
