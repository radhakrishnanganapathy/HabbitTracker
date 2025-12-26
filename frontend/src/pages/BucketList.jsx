import { useState, useEffect } from 'react';
import './BucketList.css';

const BucketList = () => {
    const [bucketLists, setBucketLists] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({ total: 0, completed: 0, skipped: 0, waiting: 0 });
    const [newBucketList, setNewBucketList] = useState({
        name: '',
        description: '',
        expected_date: ''
    });
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchBucketLists();
        fetchStats();
    }, []);

    const fetchBucketLists = async () => {
        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}/bucketlists/`);
            if (response.ok) {
                const data = await response.json();
                setBucketLists(data);
            }
        } catch (error) {
            console.error('Error fetching bucket lists:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}/bucketlists/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateBucketList = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newBucketList,
                expected_date: newBucketList.expected_date ? `${newBucketList.expected_date}:00Z` : null
            };
            const response = await fetch(`http://localhost:8002/users/${user.id}/bucketlists/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                fetchBucketLists();
                fetchStats();
                setShowModal(false);
                setNewBucketList({ name: '', description: '', expected_date: '' });
            }
        } catch (error) {
            console.error('Error creating bucket list:', error);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const response = await fetch(`http://localhost:8002/bucketlists/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchBucketLists();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating bucket list:', error);
        }
    };

    return (
        <div className="bucket-list-container">
            {/* Stats Section */}
            <div className="stats-section">
                <div className="stats-header">
                    <h2>Bucket List Statistics</h2>
                </div>
                <div className="stats-cards">
                    <div className="stat-card total">
                        <h3>Total Created</h3>
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
                    <div className="stat-card waiting">
                        <h3>Waiting</h3>
                        <p>{stats.waiting}</p>
                    </div>
                </div>
            </div>

            <div className="bucket-list-header">
                <h1>My Bucket List</h1>
                <button className="create-btn" onClick={() => setShowModal(true)}>
                    + Add Item
                </button>
            </div>

            <div className="bucket-list-grid">
                {bucketLists.length === 0 ? (
                    <p className="no-items">No bucket list items yet. Dream big and add one!</p>
                ) : (
                    bucketLists.map(item => (
                        <div key={item.id} className={`bucket-list-card ${item.status}`}>
                            <div className="card-header">
                                <h3>{item.name}</h3>
                                <span className={`status-badge ${item.status}`}>{item.status}</span>
                            </div>
                            <p className="description">{item.description}</p>
                            <div className="meta-info">
                                <span>Expected: {new Date(item.expected_date).toLocaleDateString()}</span>
                                <span>Created: {new Date(item.created_date).toLocaleDateString()}</span>
                            </div>
                            <div className="card-actions">
                                {item.status !== 'completed' && (
                                    <button
                                        className="action-btn btn-complete"
                                        onClick={() => handleStatusUpdate(item.id, 'completed')}
                                        title="Mark as Completed"
                                    >
                                        ✓ Complete
                                    </button>
                                )}
                                {item.status !== 'skipped' && item.status !== 'completed' && (
                                    <button
                                        className="action-btn btn-skip"
                                        onClick={() => handleStatusUpdate(item.id, 'skipped')}
                                        title="Skip"
                                    >
                                        ✕ Skip
                                    </button>
                                )}
                                {item.status !== 'waiting' && (
                                    <button
                                        className="action-btn btn-wait"
                                        onClick={() => handleStatusUpdate(item.id, 'waiting')}
                                        title="Move to Waiting"
                                    >
                                        ⟲ Waiting
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add Bucket List Item</h2>
                        <form onSubmit={handleCreateBucketList}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newBucketList.name}
                                    onChange={e => setNewBucketList({ ...newBucketList, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newBucketList.description}
                                    onChange={e => setNewBucketList({ ...newBucketList, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Expected Date</label>
                                <input
                                    type="datetime-local"
                                    value={newBucketList.expected_date}
                                    onChange={e => setNewBucketList({ ...newBucketList, expected_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BucketList;
