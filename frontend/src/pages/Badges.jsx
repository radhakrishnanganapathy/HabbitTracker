import { useState, useEffect } from 'react';
import './Badges.css';

const Badges = () => {
    const [routines, setRoutines] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchRoutines();
    }, []);

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

    // Calculate collected badges
    const collectedBadges = milestones.map(milestone => {
        // Count how many routines have reached this milestone
        const count = routines.filter(r => r.longest_streak >= milestone.days).length;
        return {
            ...milestone,
            count
        };
    });

    return (
        <div className="badges-page-container">
            <h1>My Badge Collection</h1>
            <p className="badges-subtitle">Track your consistency milestones across all routines.</p>

            <div className="badges-grid-large">
                {collectedBadges.map((badge, index) => (
                    <div key={index} className={`badge-card ${badge.count > 0 ? 'unlocked' : 'locked'}`}>
                        <div className="badge-icon-large">{badge.icon}</div>
                        <div className="badge-info">
                            <h3>{badge.label}</h3>
                            {badge.count > 0 ? (
                                <span className="badge-count">Collected: {badge.count} times</span>
                            ) : (
                                <span className="badge-locked-text">Locked</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Badges;
