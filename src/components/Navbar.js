import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      navigate('/'); // Navigate back to the login page or home page
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg  navbar-light bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">留言板應用</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/create">發布文章</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/articles">文章列表</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/userProfile">個人資料</Link>
            </li>
          </ul>
          {user && (
            <button className="btn btn-outline-danger" onClick={handleLogout}>登出</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;