import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Heart, ThumbsUp, ThumbsDown, Image, Save, Camera, Upload, X } from 'lucide-react';
import Webcam from 'react-webcam';
import './Profile.css';

function Profile() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        dob: '',
        hobby: '',
        positive_traits: '',
        negative_traits: '',
        profile_image: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (!storedUser) {
                    navigate('/login');
                    return;
                }

                // Fetch latest user data from API
                const response = await fetch(`http://localhost:8002/users/${storedUser.id}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setFormData({
                        full_name: userData.full_name || '',
                        dob: userData.dob ? userData.dob.split('T')[0] : '',
                        hobby: userData.hobby || '',
                        positive_traits: userData.positive_traits || '',
                        negative_traits: userData.negative_traits || '',
                        profile_image: userData.profile_image || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8002/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, profile_image: data.url }));
                setMessage('Image uploaded successfully!');
            } else {
                setMessage('Failed to upload image.');
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            setMessage('Error uploading image.');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            uploadImage(e.target.files[0]);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            // Convert base64 to blob
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "webcam-photo.jpg", { type: "image/jpeg" });
                    uploadImage(file);
                    setShowCamera(false);
                });
        }
    }, [webcamRef]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Sanitize data
        const dataToSend = { ...formData };
        if (dataToSend.dob === '') {
            dataToSend.dob = null;
        }

        try {
            const response = await fetch(`http://localhost:8002/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setMessage('Profile updated successfully!');
            } else {
                const errorData = await response.json();
                console.error("Update failed:", errorData);
                setMessage(`Failed to update profile: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage('An error occurred while updating.');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="profile-container">
            <div className="card profile-card">
                <h2>Edit Profile</h2>

                <div className="profile-header">
                    <div className="profile-avatar-container">
                        <div className="profile-avatar">
                            {formData.profile_image ? (
                                <img src={formData.profile_image} alt="Profile" />
                            ) : (
                                <img src={`https://ui-avatars.com/api/?name=${user.full_name || user.username}&background=random`} alt="Profile" />
                            )}
                        </div>
                        <div className="avatar-actions">
                            <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()} title="Upload Image">
                                <Upload size={18} />
                            </button>
                            <button type="button" className="icon-btn" onClick={() => setShowCamera(true)} title="Take Photo">
                                <Camera size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                    <div className="profile-info">
                        <h3>{user.username}</h3>
                        <p className="email">{user.email}</p>
                    </div>
                </div>

                {message && <div className={`message ${message.includes('Failed') || message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-icon-wrapper">
                            <User size={18} />
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Date of Birth</label>
                        <div className="input-icon-wrapper">
                            <Calendar size={18} />
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Hobby</label>
                        <div className="input-icon-wrapper">
                            <Heart size={18} />
                            <input
                                type="text"
                                name="hobby"
                                value={formData.hobby}
                                onChange={handleChange}
                                placeholder="Reading, Gaming, etc."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Positive Traits</label>
                        <div className="input-icon-wrapper">
                            <ThumbsUp size={18} />
                            <textarea
                                name="positive_traits"
                                value={formData.positive_traits}
                                onChange={handleChange}
                                placeholder="Hardworking, Creative..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Negative Traits</label>
                        <div className="input-icon-wrapper">
                            <ThumbsDown size={18} />
                            <textarea
                                name="negative_traits"
                                value={formData.negative_traits}
                                onChange={handleChange}
                                placeholder="Procrastination..."
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary">
                        <Save size={18} style={{ marginRight: '8px' }} />
                        Save Changes
                    </button>
                </form>
            </div>

            {showCamera && (
                <div className="camera-modal">
                    <div className="camera-content">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width="100%"
                        />
                        <div className="camera-controls">
                            <button onClick={capture} className="btn-primary">Capture</button>
                            <button onClick={() => setShowCamera(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
