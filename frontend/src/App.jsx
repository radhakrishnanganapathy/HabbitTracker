import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import Todo from './pages/Todo';
import BucketList from './pages/BucketList';
import Routine from './pages/Routine';
import RoutineDetail from './pages/RoutineDetail';
import './App.css';

import Navbar from './components/Navbar';
// Trigger HMR update
import PrivateRoute from './components/PrivateRoute';

import Badges from './pages/Badges';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/routine" element={<PrivateRoute><Routine /></PrivateRoute>} />
            <Route path="/routine/:id" element={<PrivateRoute><RoutineDetail /></PrivateRoute>} />
            <Route path="/badges" element={<PrivateRoute><Badges /></PrivateRoute>} />
            <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
            <Route path="/todo" element={<PrivateRoute><Todo /></PrivateRoute>} />
            <Route path="/bucketlist" element={<PrivateRoute><BucketList /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
