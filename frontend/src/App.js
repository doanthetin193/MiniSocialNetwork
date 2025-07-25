import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CreatePostPage from './pages/CreatePostPage';
import MyPostsPage from './pages/MyPostsPage';
import Navbar from './components/Navbar';
import ChatPage from './pages/ChatPage';
import UsersListPage from './pages/UsersListPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import NotificationPage from './pages/NotificationPage';
import WelcomePage from './pages/WelcomePage';
import AdminApp from './pages/AdminApp';
import AuthChecker from './components/AuthChecker';

const AppContent = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/welcome' || location.pathname === '/admin';

  return (
    <AuthChecker>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Loading...</div>} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/myposts" element={<MyPostsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminApp />} />
      </Routes>
    </AuthChecker>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
