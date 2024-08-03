import { useState, useEffect, } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { createAsyncMessage } from '../Silce/messageSlice';
import MessageToast from '../components/MessageToast'
import Moment from 'react-moment';
import 'moment-timezone';
import 'moment/locale/zh-tw';  // 加载中文语言包

const Messages = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const navigate = useNavigate();


  useEffect(() => {
    const q = query(collection(firestore, 'messages'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
      setLoading(false); // 当数据加载完成后设置加载状态为 false
    });
    return () => unsubscribe();
  }, []);
  const handleMessageSubmit = async () => {
    if (newMessage.trim()) {

      try {
        const userDisplayName = user ? (user.displayName || user.email) : 'Unknown User';
        const userEmail = user ? user.email || 'Default Email' : 'Default Email';
        const docRef = await addDoc(collection(firestore, 'messages'), {
          text: newMessage,
          createdAt: serverTimestamp(),
          user: {
            displayName: userDisplayName,
            email: userEmail // Default email if not provided
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
          message: error||'留言失敗'
      }));             }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      navigate('/'); // 导航回登录页或首页
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  const handleDeleteMessage = async (messageId) => {
    const messageToDelete = messages.find(msg => msg.id === messageId);

    if (messageToDelete && messageToDelete.user.email === user.email) {
      try {
        await deleteDoc(doc(firestore, 'messages', messageId));
        dispatch(createAsyncMessage({
          success: true,
          message: '留言刪除成功',
      }));
          } catch (error) {
            dispatch(createAsyncMessage({
              success: false,
              message: error,
          }));      }
    } else {
      console.error("You can only delete your own messages.");
    }
  };
  return (
 
    <div className="container">
      <div className="message-board">
        <div className="message-input">
          <h1 className='text-center'>react 留言板</h1>

          <p className="user-info">{user ? user.displayName || user.email : 'Unknown User'}登入成功</p>
          <div className=" mb-3">
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
