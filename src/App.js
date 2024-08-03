import { Routes, Route, Navigate } from "react-router-dom"
import {useState,useEffect} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './page/Login';
import Messages from './page/Message';
import Navbar from "./components/Navbar";
import CreatePost from "./page/CreatePost";
import Articles from "./page/Articles";
import ArticleDetail from "./page/ArticleDetail";
import './stylesheets/all.scss';
import UserProfile from "./page/UserProfile";

const App = () => {
  const [user, setUser] = useState();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  return (
    
    <div className='App'>

{user && <Navbar user={user} />}

       <Routes>
        <Route path="/" element={user ? <Navigate to="/messages" /> : <Login setUser={setUser} />} />
        <Route path="/messages" element={user ? <Messages user={user} /> : <Navigate to="/" />} />
        <Route path="/create" element={user ? <CreatePost user={user} /> : <Navigate to="/" />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/userProfile" element={user ? <UserProfile user={user} /> : <Navigate to="/" />} />
        <Route path="/articledetail/:id" element={user ? <ArticleDetail user={user} /> : <Navigate to="/" />} />
      </Routes>
    </div>
  )


}
export default App;
