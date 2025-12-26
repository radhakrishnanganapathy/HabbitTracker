import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RoutineDetail.css';

const RoutineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [routine, setRoutine] = useState(null);
    const [history, setHistory] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [taskLogs, setTaskLogs] = useState([]);

    useEffect(() => {
        fetchRoutineData();
    }, [id]);

    const fetchRoutineData = async () => {
        try {
            // Fetch all routines to find the one we need (simplest given current API)
            // Or we could add a get_routine endpoint, but this works for now.
            const routinesRes = await fetch(`http://localhost:8002/users/${user.id}/routines/`);
            if (routinesRes.ok) {
                const routines = await routinesRes.json();
                const found = routines.find(r => r.id === parseInt(id));
                setRoutine(found);
                if (found) {
                    setEditData({
                        name: found.name,
                        routine_type: found.routine_type,
                        description: found.description || '',
                        tasks: found.tasks.map(t => ({ ...t })) // Copy tasks including IDs
                    });
                }
            }

            const historyRes = await fetch(`http://localhost:8002/routines/${id}/history`);
            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data.map(d => new Date(d).toISOString().split('T')[0]));
            }

            const logsRes = await fetch(`http://localhost:8002/routines/${id}/logs`);
            if (logsRes.ok) {
                const data = await logsRes.json();
                setTaskLogs(data);
            }
        } catch (error) {
            console.error("Error fetching routine data:", error);
        }
    };

    const toggleTask = async (taskId, currentStatus) => {
        const isCompleted = currentStatus === 'completed';
        const method = isCompleted ? 'DELETE' : 'POST';
        const url = `http://localhost:8002/tasks/${taskId}/complete?date_str=${selectedDate}`;

        try {
            const response = await fetch(url, { method });
            if (response.ok) {
                fetchRoutineData(); // Refresh data to update graph and logs
            }
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const handleTaskChange = (index, field, value) => {
        const updatedTasks = [...editData.tasks];
        updatedTasks[index][field] = value;
        setEditData({ ...editData, tasks: updatedTasks });
    };

    const handleAddTask = () => {
        setEditData({
            ...editData,
            tasks: [...editData.tasks, { name: '', time: '' }]
        });
    };

    const handleRemoveTask = (index) => {
        const updatedTasks = editData.tasks.filter((_, i) => i !== index);
        setEditData({ ...editData, tasks: updatedTasks });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8002/routines/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            if (response.ok) {
                setShowEditModal(false);
                fetchRoutineData();
            }
        } catch (error) {
            console.error("Error updating routine:", error);
        }
    };

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const getBadges = (streak) => {
        const milestones = [
            { days: 3, label: "3 Days", icon: "🥉" },
            { days: 7, label: "1 Week", icon: "🥈" },
            { days: 10, label: "10 Days", icon: "🥇" },
            { days: 14, label: "2 Weeks", icon: "🎗️" },
            { days: 25, label: "25 Days", icon: "🎖️" },
            { days: 50, label: "50 Days", icon: "🌟" },
            { days: 100, label: "100 Days", icon: "💯" },
            { days: 150, label: "150 Days", icon: "👑" },
            { days: 200, label: "200 Days", icon: "💎" },
            { days: 365, label: "1 Year", icon: "🏆" }
        ];
        return milestones.map(m => ({
            ...m,
            unlocked: streak >= m.days
        }));
    };

    const renderContributionGraph = () => {
        const startDate = new Date(selectedYear, 0, 1);
        const endDate = new Date(selectedYear, 11, 31);
        const days = [];

        // Calculate start padding (to align Jan 1st with correct day of week)
        // GitHub graph starts on Sunday (row 0)
        const startDay = startDate.getDay(); // 0 = Sunday

        // Generate all days for the year
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                isCompleted: history.includes(dateStr),
                dayOfWeek: currentDate.getDay(),
                month: currentDate.getMonth(),
                day: currentDate.getDate()
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Month labels logic
        const monthLabels = [];
        let currentMonth = -1;
        days.forEach((day, index) => {
            if (day.month !== currentMonth) {
                // Calculate column index (approximate)
                // Total days so far + start padding / 7
                const colIndex = Math.floor((index + startDay) / 7);
                monthLabels.push({ name: new Date(selectedYear, day.month, 1).toLocaleString('default', { month: 'short' }), col: colIndex });
                currentMonth = day.month;
            }
        });

        return (
            <div className="github-graph-container">
                <div className="graph-wrapper">
                    <div className="month-labels">
                        {monthLabels.map((m, i) => (
                            <span key={i} style={{ left: `${m.col * 14}px` }}>{m.name}</span>
                        ))}
                    </div>
                    <div className="graph-body">
                        <div className="day-labels">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                        </div>
                        <div className="graph-grid">
                            {/* Add empty slots for start padding */}
                            {Array.from({ length: startDay }).map((_, i) => (
                                <div key={`pad-${i}`} className="graph-day empty"></div>
                            ))}
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={`graph-day ${day.isCompleted ? 'completed' : ''} ${selectedDate === day.date ? 'selected' : ''}`}
                                    title={`${day.date}: ${day.isCompleted ? 'Completed' : 'No activity'}`}
                                    onClick={() => setSelectedDate(day.date)}
                                ></div>
                            ))}
                        </div>
                    </div>
                    <div className="graph-footer">
                        <span>Learn how we count contributions</span>
                        <div className="legend">
                            <span>Less</span>
                            <div className="graph-day"></div>
                            <div className="graph-day completed" style={{ opacity: 0.4 }}></div>
                            <div className="graph-day completed" style={{ opacity: 0.7 }}></div>
                            <div className="graph-day completed"></div>
                            <span>More</span>
                        </div>
                    </div>
                </div>
                <div className="year-selector-vertical">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <button
                            key={year}
                            className={selectedYear === year ? 'active' : ''}
                            onClick={() => setSelectedYear(year)}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    if (!routine) return <div>Loading...</div>;

    const badges = getBadges(routine.longest_streak);
    const nextMilestone = badges.find(b => !b.unlocked);

    // Filter logs for selected date
    const getTaskStatus = (taskId) => {
        const log = taskLogs.find(l => l.task_id === taskId && l.date.startsWith(selectedDate));
        return log ? log.status : null;
    };

    return (
        <div className="routine-detail-container">
            <button className="back-btn" onClick={() => navigate('/routine')}>← Back</button>

            <header className="detail-header">
                <div>
                    <h1>{routine.name}</h1>
                    <span className="routine-type-badge">{routine.routine_type}</span>
                    <p className="description">{routine.description}</p>
                </div>
                <button className="edit-btn" onClick={() => setShowEditModal(true)}>Edit Routine</button>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Current Streak</h3>
                    <div className="stat-value">{routine.current_streak} <span className="stat-unit">days</span></div>
                </div>
                <div className="stat-card">
                    <h3>Best Streak</h3>
                    <div className="stat-value">{routine.longest_streak} <span className="stat-unit">days</span></div>
                </div>
                <div className="stat-card">
                    <h3>Total Days Completed</h3>
                    <div className="stat-value">{history.length} <span className="stat-unit">days</span></div>
                </div>
                <div className="stat-card">
                    <h3>Started On</h3>
                    <div className="stat-value small">{new Date(routine.created_at || Date.now()).toLocaleDateString()}</div>
                </div>
            </div>



            <div className="badges-section" onClick={() => navigate('/badges')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Milestones & Badges</h3>
                    <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>View All →</span>
                </div>
                {nextMilestone && (
                    <div className="next-milestone">
                        <span>Next Goal: <strong>{nextMilestone.label}</strong></span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(routine.longest_streak / nextMilestone.days) * 100}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">{routine.longest_streak} / {nextMilestone.days} days</span>
                    </div>
                )}
                <div className="badges-list">
                    {badges.map((badge, i) => (
                        <div key={i} className={`badge-item ${badge.unlocked ? 'unlocked' : 'locked'}`}>
                            <span className="badge-icon">{badge.icon}</span>
                            <span className="badge-label">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="graph-section">
                <h3>Consistency Graph</h3>
                {renderContributionGraph()}
            </div>

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Routine</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={editData.routine_type}
                                    onChange={e => setEditData({ ...editData, routine_type: e.target.value })}
                                >
                                    <option value="All Days">All Days</option>
                                    <option value="Weekday">Weekday</option>
                                    <option value="Weekend">Weekend</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                />
                            </div>

                            <div className="tasks-edit-list">
                                <label>Tasks</label>
                                {editData.tasks.map((task, index) => (
                                    <div key={index} className="task-edit-row">
                                        <input
                                            type="time"
                                            value={task.time}
                                            onChange={e => handleTaskChange(index, 'time', e.target.value)}
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={task.name}
                                            onChange={e => handleTaskChange(index, 'name', e.target.value)}
                                            placeholder="Task Name"
                                            required
                                        />
                                        <button type="button" className="remove-task-btn" onClick={() => handleRemoveTask(index)}>✕</button>
                                    </div>
                                ))}
                                <button type="button" className="add-task-btn" onClick={handleAddTask}>+ Add Task</button>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="submit-btn">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoutineDetail;
