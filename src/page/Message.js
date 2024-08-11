import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { createAsyncMessage } from '../Silce/messageSlice';
import Loading from '../components/Loading'; // Import Loading component
import Moment from 'react-moment';
import 'moment-timezone';
import 'moment/locale/zh-tw';  // 加载中文语言包

const Messages = () => {
  const [messages, setMessages] = useState([]);//儲存留言列表
  const [newMessage, setNewMessage] = useState('');//儲存新的留言
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.user.user); // 从 Redux store 获取用户数据

  useEffect(() => {
    //最新的留言出现在最前面，因此可以按 createdAt 字段降序排序，以確保最新的消息在列表顶部。
    //如果需要按時間最早的消息在前面，使用升序排序（orderBy('createdAt', 'asc')）。
    const q = query(collection(firestore, 'messages'), orderBy('createdAt'));
     // 註冊監聽以立即更新消息列表

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);// 更新留言列表
      setLoading(false); // Set loading to false after data is loaded
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const handleMessageSubmit = async () => {
    if (newMessage.trim()) {
      try {
        // 獲取用户的顯示名稱和郵箱
        const userDisplayName = user ? (user.displayName || user.email) : 'Unknown User';
        const userEmail = user ? user.email || 'Default Email' : 'Default Email';
        // 将新消息添加到 Firestore 中
        await addDoc(collection(firestore, 'messages'), {
          text: newMessage,
          createdAt: serverTimestamp(),
          user: {
            displayName: userDisplayName,
            email: userEmail
          },
        });

        setNewMessage('');
        dispatch(createAsyncMessage({
          success: true,
          message: '留言成功',
        }));
      } catch (error) {
        dispatch(createAsyncMessage({
          success: false,
          message: error.message || '留言失敗',
        }));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      navigate('/'); // Navigate to login page or homepage
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  // 留言刪除
  const handleDeleteMessage = async (messageId) => {
    // 找到要删除的消息
    const messageToDelete = messages.find(msg => msg.id === messageId);
   //  只能刪除自己的留言
     if (messageToDelete && messageToDelete.user.email === user.email) {
      try {
        await deleteDoc(doc(firestore, 'messages', messageId));
        dispatch(createAsyncMessage({
          success: true,
          message: '留言刪除成功',
        }));
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    } else {
      console.error("You can only delete your own messages.");
    }
  };

  return (
    <div className="container">     
        <Loading  isLoading={loading}/> 
        <div className="message-board">
          <div className="message-input">
            <h1 className='text-center'>React 留言板</h1>
            <p className="user-info">{user ? user.displayName || user.email : 'Unknown User'} 登入成功</p>
            <div className="mb-3">
              <label htmlFor="message" className="form-label">留言內容</label>
              <input
                value={newMessage}
                id="message"
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="留言"
                className="form-control mb-3"
              />
              <button onClick={handleMessageSubmit} className="btn btn-primary">送出</button>
            </div>
          </div>
          <ul className="list-group">
            {messages.map(message => (
              <li key={message.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{message.user.displayName || message.user.email}</strong>
                    <span className="text-muted ms-2">
                      <Moment fromNow>{message.createdAt?.toDate()}</Moment>
                    </span>
                  </div>
                  {user && user.email === message.user.email && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(message.id)}>删除</button>
                  )}
                </div>
                <p className="mb-0">{message.text}</p>
              </li>
            ))}
          </ul>
          <button className='btn btn-secondary mt-3' onClick={handleLogout}>登出</button>
        </div>
    </div>
  );
};

export default Messages;
