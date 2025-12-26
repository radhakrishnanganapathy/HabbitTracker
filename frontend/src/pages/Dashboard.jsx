import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [activeGoals, setActiveGoals] = useState([]);
    const [timeLeft, setTimeLeft] = useState({});
    const [routines, setRoutines] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);
    const [nextTask, setNextTask] = useState(null);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [upcomingTodos, setUpcomingTodos] = useState([]);
    const [todayTodoStats, setTodayTodoStats] = useState({ completed: 0, total: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchActiveGoals(parsedUser.id);
        fetchRoutines(parsedUser.id);
        fetchRoutines(parsedUser.id);
        fetchCompletedTasks(parsedUser.id);
        fetchTodos(parsedUser.id);
    }, [navigate]);

    const fetchActiveGoals = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8002/users/${userId}/goals/`);
            if (response.ok) {
                const data = await response.json();
                const active = data.filter(goal => goal.status === 'Active');
                setActiveGoals(active);
            }
        } catch (error) {
            console.error("Error fetching goals:", error);
        }
    };

    const fetchRoutines = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8002/users/${userId}/routines/`);
            if (response.ok) {
                const data = await response.json();
                setRoutines(data);
            }
        } catch (error) {
            console.error("Error fetching routines:", error);
        }
    };

    const fetchCompletedTasks = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8002/users/${userId}/tasks/today`);
            if (response.ok) {
                const data = await response.json();
                setCompletedTasks(data.map(log => log.task_id));
            }
        } catch (error) {
            console.error("Error fetching completed tasks:", error);
        }
    };

    const fetchTodos = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8002/users/${userId}/todos/`);
            if (response.ok) {
                const data = await response.json();
                filterUpcomingTodos(data);
                calculateTodayStats(data);
            }
        } catch (error) {
            console.error("Error fetching todos:", error);
        }
    };

    const calculateTodayStats = (todos) => {
        const today = new Date().toISOString().split('T')[0];
        const todayTodos = todos.filter(todo => todo.due_date.startsWith(today));
        const completed = todayTodos.filter(todo => todo.status === 'completed').length;
        setTodayTodoStats({ completed, total: todayTodos.length });
    };

    const filterUpcomingTodos = (todos) => {
        const now = new Date();
        const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);

        const upcoming = todos.filter(todo => {
            if (todo.status !== 'pending') return false;
            const dueDate = new Date(todo.due_date);
            return dueDate >= now && dueDate <= thirtyMinutesLater;
        });

        // Sort by due date and take top 5
        upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        setUpcomingTodos(upcoming.slice(0, 5));
    };

    const toggleTaskCompletion = async (taskId, status) => {
        try {
            // If status is null/undefined, it means we are un-completing (delete log)
            // But here we are adding tick (completed) or cross (skipped)
            // If we want to toggle off, we might need another way, but user asked for tick/wrong to override.

            const response = await fetch(`http://localhost:8002/tasks/${taskId}/complete?status=${status}`, {
                method: 'POST'
            });

            if (response.ok) {
                setCompletedTasks([...completedTasks, taskId]);
            }
        } catch (error) {
            console.error("Error toggling task completion:", error);
        }
    };

    useEffect(() => {
        if (routines.length > 0) {
            updateCurrentAndNextTask();
            const interval = setInterval(updateCurrentAndNextTask, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [routines, completedTasks]); // Re-run when completed tasks change

    const updateCurrentAndNextTask = () => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = currentDay === 0 || currentDay === 6;
        const dayType = isWeekend ? 'Weekend' : 'Weekday';

        // Filter routines applicable for today
        const todayRoutines = routines.filter(r =>
            r.routine_type === 'All Days' || r.routine_type === dayType
        );

        // Collect all tasks with their times
        let allTasks = [];
        todayRoutines.forEach(routine => {
            routine.tasks.forEach(task => {
                allTasks.push({
                    ...task,
                    routineName: routine.name,
                    routineType: routine.routine_type,
                    isCompleted: completedTasks.includes(task.id)
                });
            });
        });

        // Sort tasks by time
        allTasks.sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        // Find first incomplete task -> Current
        // The one after -> Next

        const incompleteTasks = allTasks.filter(t => !t.isCompleted);

        let current = null;
        let next = null;

        if (incompleteTasks.length > 0) {
            current = incompleteTasks[0];
            if (incompleteTasks.length > 1) {
                next = incompleteTasks[1];
            }
        } else {
            // All done!
            current = null;
            next = null;
        }

        setCurrentTask(current);
        setNextTask(next);
    };

    const getTaskStatusClass = (task, isNext = false) => {
        if (!task) return '';
        if (isNext) return 'task-upcoming'; // Yellow

        const now = new Date();
        const currentTimeStr = now.toTimeString().slice(0, 5);

        // If current task time is passed -> Red (Overdue)
        if (task.time < currentTimeStr) {
            return 'task-overdue';
        }
        return '';
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = {};
            activeGoals.forEach(goal => {
                const end = new Date(goal.end_date).getTime();
                const now = new Date().getTime();
                const distance = end - now;

                if (distance < 0) {
                    newTimeLeft[goal.id] = "Expired";
                } else {
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    newTimeLeft[goal.id] = `${days}d ${hours}h ${minutes}m`;
                }
            });
            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [activeGoals]);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Welcome, {user.full_name ? user.full_name.split('@')[0] : 'User'}</h1>
            </header>

            <div className="dashboard-content">
                {/* Daily Routine Section */}
                {(currentTask || nextTask) ? (
                    <div className="routine-section">
                        <h2>Daily Routine</h2>
                        <div className="routine-grid">
                            {currentTask && (
                                <div className={`routine-card-dashboard ${getTaskStatusClass(currentTask)}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="routine-status-label">Current Task</span>
                                        <div className="task-actions">
                                            <button
                                                className="action-btn btn-tick"
                                                onClick={() => toggleTaskCompletion(currentTask.id, 'completed')}
                                                title="Complete"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                className="action-btn btn-cross"
                                                onClick={() => toggleTaskCompletion(currentTask.id, 'skipped')}
                                                title="Skip"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                    <span className="routine-task-name">{currentTask.name}</span>
                                    <span className="routine-task-time">{currentTask.time}</span>
                                    <div className="routine-info">
                                        <span className="routine-badge">{currentTask.routineName}</span>
                                        <span className="routine-badge">{currentTask.routineType}</span>
                                    </div>
                                </div>
                            )}
                            {nextTask && (
                                <div className={`routine-card-dashboard ${getTaskStatusClass(nextTask, true)}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="routine-status-label">Up Next</span>
                                    </div>
                                    <span className="routine-task-name">{nextTask.name}</span>
                                    <span className="routine-task-time">{nextTask.time}</span>
                                    <div className="routine-info">
                                        <span className="routine-badge">{nextTask.routineName}</span>
                                        <span className="routine-badge">{nextTask.routineType}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="routine-section">
                        <h2>Daily Routine</h2>
                        <p>All tasks for today are completed! 🎉</p>
                    </div>
                )}

                {/* Upcoming Todos Section */}
                {upcomingTodos.length > 0 && (
                    <div className="routine-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Upcoming Todos (Next 30 Mins)</h2>
                            <span className="routine-badge" style={{ fontSize: '0.9rem' }}>Today: {todayTodoStats.completed}/{todayTodoStats.total} Done</span>
                        </div>
                        <div className="routine-grid">
                            {upcomingTodos.map(todo => (
                                <div key={todo.id} className="routine-card-dashboard task-upcoming">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="routine-status-label">Due Soon</span>
                                    </div>
                                    <span className="routine-task-name">{todo.name}</span>
                                    <span className="routine-task-time">{new Date(todo.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <div className="routine-info">
                                        <span className="routine-badge">Todo</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeGoals.length > 0 ? (
                    <div className="active-goals-section">
                        <h2>Active Goals</h2>
                        <div className="goals-grid">
                            {activeGoals.map(goal => (
                                <div key={goal.id} className="card goal-preview-card">
                                    <h3>{goal.name}</h3>
                                    <div className="countdown">
                                        <span className="time">{timeLeft[goal.id] || "Loading..."}</span>
                                        <span className="label">Remaining</span>
                                    </div>
                                    <div className="goal-dates">
                                        <small>Ends: {new Date(goal.end_date).toLocaleDateString()}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p>Select an option from the menu to get started or create a goal.</p>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
