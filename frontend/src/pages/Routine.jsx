import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Routine.css';

const Routine = () => {
    const [routines, setRoutines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newRoutine, setNewRoutine] = useState({
        name: '',
        routine_type: 'All Days',
        description: '',
        tasks: [{ name: '', time: '' }]
    });

    const [editingRoutine, setEditingRoutine] = useState(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));

    const [taskLogs, setTaskLogs] = useState([]);

    useEffect(() => {
        fetchRoutines();
        fetchTaskLogs();
    }, []);

    const fetchTaskLogs = async () => {
        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}/tasks/today`);
            if (response.ok) {
                const data = await response.json();
                setTaskLogs(data);
            }
        } catch (error) {
            console.error('Error fetching task logs:', error);
        }
    };

    const handleTaskToggle = async (taskId, isCompleted) => {
        // Optimistic Update
        const previousLogs = [...taskLogs];
        if (isCompleted) {
            setTaskLogs(prev => prev.filter(log => log.task_id !== taskId));
        } else {
            setTaskLogs(prev => [...prev, { task_id: taskId, status: 'completed', date: new Date().toISOString() }]);
        }

        const method = isCompleted ? 'DELETE' : 'POST';
        const url = `http://localhost:8002/tasks/${taskId}/complete`;

        try {
            const response = await fetch(url, { method });
            if (response.ok) {
                // Fetch actual data to confirm and sync
                fetchTaskLogs();
                fetchRoutines();
            } else {
                // Revert on failure
                setTaskLogs(previousLogs);
                console.error("Failed to toggle task");
            }
        } catch (error) {
            console.error("Error toggling task:", error);
            setTaskLogs(previousLogs);
        }
    };

    const fetchRoutines = async () => {
        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}/routines/`);
            if (response.ok) {
                const data = await response.json();
                setRoutines(data);
            }
        } catch (error) {
            console.error('Error fetching routines:', error);
        }
    };

    const handleAddTask = () => {
        setNewRoutine({
            ...newRoutine,
            tasks: [...newRoutine.tasks, { name: '', time: '' }]
        });
    };

    const handleTaskChange = (index, field, value) => {
        const updatedTasks = [...newRoutine.tasks];
        updatedTasks[index][field] = value;
        setNewRoutine({ ...newRoutine, tasks: updatedTasks });
    };

    const handleDeleteRoutine = async (routineId) => {
        if (!window.confirm("Are you sure you want to delete this routine?")) return;
        try {
            const response = await fetch(`http://localhost:8002/routines/${routineId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchRoutines();
            }
        } catch (error) {
            console.error("Error deleting routine:", error);
        }
    };

    const handleEditClick = (routine) => {
        setEditingRoutine(routine);
        setNewRoutine({
            name: routine.name,
            routine_type: routine.routine_type,
            description: routine.description || '',
            tasks: routine.tasks.map(t => ({ id: t.id, name: t.name, time: t.time }))
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingRoutine
                ? `http://localhost:8002/routines/${editingRoutine.id}`
                : `http://localhost:8002/users/${user.id}/routines/`;

            const method = editingRoutine ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newRoutine,
                    order_index: routines.length + 1
                }),
            });

            if (response.ok) {
                setShowModal(false);
                setEditingRoutine(null);
                fetchRoutines();
                setNewRoutine({
                    name: '',
                    routine_type: 'All Days',
                    description: '',
                    tasks: [{ name: '', time: '' }]
                });
            }
        } catch (error) {
            console.error('Error saving routine:', error);
        }
    };

    const getBadges = (streak) => {
        const milestones = [3, 7, 10, 14, 25, 50, 100, 150, 200, 365];
        return milestones.filter(m => streak >= m).map(m => {
            if (m === 7) return "1 Week";
            if (m === 14) return "2 Weeks";
            if (m === 365) return "1 Year";
            return `${m} Days`;
        });
    };

    const handleCardClick = (id, e) => {
        // Prevent navigation if clicking action buttons
        if (e.target.closest('.routine-actions')) return;
        navigate(`/routine/${id}`);
    };

    return (
        <div className="routine-container">
            <div className="routine-header">
                <h1>Daily Routines</h1>
                <button className="create-routine-btn" onClick={() => {
                    setEditingRoutine(null);
                    setNewRoutine({
                        name: '',
                        routine_type: 'All Days',
                        description: '',
                        tasks: [{ name: '', time: '' }]
                    });
                    setShowModal(true);
                }}>
                    + Create New Routine
                </button>
            </div>

            <div className="routines-grid">
                {routines.map((routine) => (
                    <div
                        key={routine.id}
                        className="routine-card"
                        onClick={(e) => handleCardClick(routine.id, e)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="routine-card-header">
                            <div>
                                <span className="routine-name">{routine.name}</span>
                                <span className="routine-type">{routine.routine_type}</span>
                            </div>
                            <div className="routine-actions">
                                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleEditClick(routine); }}>✎</button>
                                <button className="icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteRoutine(routine.id); }}>🗑</button>
                            </div>
                        </div>

                        <div className="routine-stats">
                            <div className="stat-item">
                                <span className="stat-value">{routine.current_streak}</span>
                                <span className="stat-label">Current Streak</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{routine.longest_streak}</span>
                                <span className="stat-label">Best Streak</span>
                            </div>
                        </div>

                        <div className="routine-badges">
                            {getBadges(routine.longest_streak).map((badge, i) => (
                                <span key={i} className="badge-pill">🏆 {badge}</span>
                            ))}
                        </div>

                        <div className="routine-tasks">
                            {routine.tasks.map((task, index) => {
                                const isCompleted = taskLogs.some(log => log.task_id === task.id && log.status === 'completed');
                                return (
                                    <div key={index} className="task-item" onClick={(e) => { e.stopPropagation(); handleTaskToggle(task.id, isCompleted); }}>
                                        <div className="task-info-left">
                                            <span className="task-time">{task.time}</span>
                                            <span className={`task-name ${isCompleted ? 'completed' : ''}`}>{task.name}</span>
                                        </div>
                                        <div className={`task-status-icon ${isCompleted ? 'completed' : 'incomplete'}`}>
                                            {isCompleted ? '✓' : '✕'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingRoutine ? 'Edit Routine' : 'Create New Routine'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Routine Name</label>
                                <input
                                    type="text"
                                    value={newRoutine.name}
                                    onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                                    placeholder="e.g., Morning Routine"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={newRoutine.routine_type}
                                    onChange={(e) => setNewRoutine({ ...newRoutine, routine_type: e.target.value })}
                                >
                                    <option value="All Days">All Days</option>
                                    <option value="Weekday">Weekday</option>
                                    <option value="Weekend">Weekend</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tasks</label>
                                {newRoutine.tasks.map((task, index) => (
                                    <div key={index} className="task-inputs">
                                        <input
                                            type="time"
                                            value={task.time}
                                            onChange={(e) => handleTaskChange(index, 'time', e.target.value)}
                                            required
                                            style={{ marginBottom: '0.5rem' }}
                                        />
                                        <input
                                            type="text"
                                            value={task.name}
                                            onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                                            placeholder="Task name"
                                            required
                                        />
                                    </div>
                                ))}
                                <button type="button" className="add-task-btn" onClick={handleAddTask}>
                                    + Add Another Task
                                </button>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    {editingRoutine ? 'Save Changes' : 'Create Routine'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Routine;
