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
import MessageToast from "./components/MessageToast";

const App = () => {
   // 定義狀態来存储當前的用户
  const [user, setUser] = useState();
  useEffect(() => {
      // 使用 useEffect 来監聽用户的認證狀態變化
        // 使用 onAuthStateChanged 来監聽認證狀態的變化
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    // 清理函数：當组件卸載时取消訂閱
    return () => unsubscribe();
  }, []);
  return (
    
    <div className='App'>
      < MessageToast/>
      {/* 如果用户以登入，則顯示 Navbar 组件 */}
{user && <Navbar user={user} />}

       <Routes>
                {/* 根路径，根據用户是否已登入重定向到不同的頁面 */}
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
