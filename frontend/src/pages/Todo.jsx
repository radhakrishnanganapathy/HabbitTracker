import { useState, useEffect } from 'react';
import './Todo.css';

const Todo = () => {
    const [todos, setTodos] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({ total: 0, completed: 0, skipped: 0, pending: 0 });
    const [filterType, setFilterType] = useState('today'); // today, date, range, month, year
    const [filterParams, setFilterParams] = useState({
        specific_date: new Date().toISOString().split('T')[0],
        date_from: '',
        date_to: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const [newTodo, setNewTodo] = useState({
        name: '',
        due_date: '',
        grace_period: '',
        description: ''
    });
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchTodos();
        fetchStats();
    }, [filterType, filterParams]); // Re-fetch stats when filter changes

    const fetchTodos = async () => {
        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}/todos/`);
            if (response.ok) {
                const data = await response.json();
                setTodos(data);
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    };

    const fetchStats = async () => {
        try {
            let url = `http://localhost:8002/users/${user.id}/todos/stats?filter_type=${filterType}`;
            if (filterType === 'date' && filterParams.specific_date) {
                url += `&specific_date=${filterParams.specific_date}`;
            } else if (filterType === 'range' && filterParams.date_from && filterParams.date_to) {
                url += `&date_from=${filterParams.date_from}&date_to=${filterParams.date_to}`;
            } else if (filterType === 'month') {
                url += `&month=${filterParams.month}&year=${filterParams.year}`;
            } else if (filterType === 'year') {
                url += `&year=${filterParams.year}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateTodo = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newTodo,
                due_date: newTodo.due_date ? `${newTodo.due_date}:00Z` : null,
                grace_period: newTodo.grace_period ? `${newTodo.grace_period}:00Z` : null
            };
            const response = await fetch(`http://localhost:8002/users/${user.id}/todos/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                fetchTodos();
                fetchStats(); // Update stats
                setShowModal(false);
                setNewTodo({ name: '', due_date: '', grace_period: '', description: '' });
            }
        } catch (error) {
            console.error('Error creating todo:', error);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const response = await fetch(`http://localhost:8002/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchTodos();
                fetchStats(); // Update stats
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    // Filter todos based on active tab
    const filteredTodos = todos.filter(todo => {
        if (activeTab === 'upcoming') {
            return todo.status === 'pending';
        } else {
            return todo.status === 'completed' || todo.status === 'skipped' || todo.status === 'cancelled';
        }
    });

    return (
        <div className="todo-container">
            {/* Stats Section */}
            <div className="stats-section">
                <div className="stats-header">
                    <h2>Task Statistics</h2>
                    <div className="filter-controls">
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="today">Today</option>
                            <option value="date">Specific Date</option>
                            <option value="range">Date Range</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                        </select>

                        {filterType === 'date' && (
                            <input type="date" value={filterParams.specific_date} onChange={(e) => setFilterParams({ ...filterParams, specific_date: e.target.value })} />
                        )}
                        {filterType === 'range' && (
                            <>
                                <input type="date" value={filterParams.date_from} onChange={(e) => setFilterParams({ ...filterParams, date_from: e.target.value })} />
                                <span>to</span>
                                <input type="date" value={filterParams.date_to} onChange={(e) => setFilterParams({ ...filterParams, date_to: e.target.value })} />
                            </>
                        )}
                        {filterType === 'month' && (
                            <>
                                <input type="number" min="1" max="12" value={filterParams.month} onChange={(e) => setFilterParams({ ...filterParams, month: parseInt(e.target.value) })} />
                                <input type="number" value={filterParams.year} onChange={(e) => setFilterParams({ ...filterParams, year: parseInt(e.target.value) })} />
                            </>
                        )}
                        {filterType === 'year' && (
                            <input type="number" value={filterParams.year} onChange={(e) => setFilterParams({ ...filterParams, year: parseInt(e.target.value) })} />
                        )}
                    </div>
                </div>
                <div className="stats-cards">
                    <div className="stat-card total">
                        <h3>Created</h3>
                        <p>{stats.total}</p>
                    </div>
                    <div className="stat-card completed">
                        <h3>Completed</h3>
                        <p>{stats.completed}</p>
                    </div>
                    <div className="stat-card skipped">
                        <h3>Skipped</h3>
                        <p>{stats.skipped}</p>
                    </div>
                    <div className="stat-card pending">
                        <h3>Not Done</h3>
                        <p>{stats.pending}</p>
                    </div>
                </div>
            </div>

            <div className="todo-header">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming Tasks
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed / History
                    </button>
                </div>
                <button className="create-todo-btn" onClick={() => setShowModal(true)}>
                    + Add Task
                </button>
            </div>

            <div className="todo-list">
                {filteredTodos.length === 0 ? (
                    <p className="no-tasks">No tasks found in this section.</p>
                ) : (
                    filteredTodos.map(todo => (
                        <div key={todo.id} className={`todo-item ${isOverdue(todo.due_date) && todo.status === 'pending' ? 'overdue' : ''}`}>
                            <div className="todo-info">
                                <h3 className={todo.status === 'completed' ? 'completed-text' : ''}>{todo.name}</h3>
                                <p className="todo-desc">{todo.description}</p>
                                <div className="todo-meta">
                                    <span>Due: {new Date(todo.due_date).toLocaleString()}</span>
                                    {todo.grace_period && <span>Grace: {new Date(todo.grace_period).toLocaleString()}</span>}
                                </div>
                            </div>
                            <div className="todo-actions">
                                {todo.status === 'pending' && (
                                    <>
                                        <button
                                            className="action-btn btn-tick"
                                            onClick={() => handleStatusUpdate(todo.id, 'completed')}
                                            title="Mark Complete"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            className="action-btn btn-cross"
                                            onClick={() => handleStatusUpdate(todo.id, 'skipped')}
                                            title="Skip Task"
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                                {todo.status !== 'pending' && (
                                    <span className={`status-badge ${todo.status}`}>{todo.status}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Task</h2>
                        <form onSubmit={handleCreateTodo}>
                            <div className="form-group">
                                <label>Task Name</label>
                                <input
                                    type="text"
                                    value={newTodo.name}
                                    onChange={e => setNewTodo({ ...newTodo, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newTodo.description}
                                    onChange={e => setNewTodo({ ...newTodo, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Due Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={newTodo.due_date}
                                    onChange={e => setNewTodo({ ...newTodo, due_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Grace Period (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={newTodo.grace_period}
                                    onChange={e => setNewTodo({ ...newTodo, grace_period: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Todo;
