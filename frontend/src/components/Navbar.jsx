import React, { useState } from 'react';
import { Menu, LogOut, X, User, Calendar, CheckSquare, Award, BookOpen, Home, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        // Clear auth token/user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Close menu
        setIsMenuOpen(false);
        // Redirect to login
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="menu-container">
                    <button className="nav-item menu-button" onClick={toggleMenu}>
                        <Menu size={24} />
                    </button>

                    {isMenuOpen && (
                        <div className="drawer-overlay" onClick={toggleMenu}>
                            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                                <div className="drawer-header">
                                    <h3>Menu</h3>
                                    <button className="close-button" onClick={toggleMenu}>
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="drawer-items">
                                    <button className="menu-item" onClick={() => handleNavigation('/')}>
                                        <Home size={18} />
                                        <span>Home</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/profile')}>
                                        <User size={18} />
                                        <span>Profile</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/goals')}>
                                        <Target size={18} />
                                        <span>Goals</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/todo')}>
                                        <CheckSquare size={18} />
                                        <span>Todo List</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/bucketlist')}>
                                        <BookOpen size={18} />
                                        <span>Bucket List</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/routine')}>
                                        <Calendar size={18} />
                                        <span>Daily Routine</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/dashboard')}>
                                        <CheckSquare size={18} />
                                        <span>Habits</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/dashboard')}>
                                        <Award size={18} />
                                        <span>Skills</span>
                                    </button>
                                    <button className="menu-item" onClick={() => handleNavigation('/dashboard')}>
                                        <BookOpen size={18} />
                                        <span>Journal</span>
                                    </button>
                                    <div className="menu-divider"></div>
                                    <button className="menu-item logout-button" onClick={handleLogout}>
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <span className="app-name">Routine Tracker</span>
            </div>

            {/* Desktop Menu */}
            <div className="navbar-center desktop-only">
                <button className="nav-link" onClick={() => handleNavigation('/')}>Home</button>
                <button className="nav-link" onClick={() => handleNavigation('/routine')}>Routine</button>
                <button className="nav-link" onClick={() => handleNavigation('/todo')}>Todo</button>
                <button className="nav-link" onClick={() => handleNavigation('/goals')}>Goals</button>
                <button className="nav-link" onClick={() => handleNavigation('/bucketlist')}>Bucket List</button>
            </div>

            <div className="navbar-right">
                <div className="desktop-only">
                    <button className="icon-btn" onClick={() => handleNavigation('/profile')} title="Profile">
                        <User size={20} />
                    </button>
                    <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
