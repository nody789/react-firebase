import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, facebookProvider, firestore } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        console.log("User logged in:", user);
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName||user.email,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
        }, { merge: true });
      } else {
        console.log("No user logged in");
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user); // 将用户信息传递给父组件
      navigate("messages"); // 导航到消息页面
      console.log("User signed in:", result.user);
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  }
  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      navigate("message");
      console.log("User signed in with email:", userCredential.user);
    } catch (error) {
      console.error("Error during email sign in:", error);
      if (error.code === 'auth/user-not-found') {
        setError('用戶不存在。請檢查您的電子郵件和密碼。');
      } else if (error.code === 'auth/wrong-password') {
        setError('密碼錯誤。請重新輸入。');
      } else {
        setError('Error during email sign in: ' + error.message);
      }
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      navigate("message")
      console.log("User registered:", userCredential.user);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('該電子郵件已被使用。請使用不同的電子郵件');
      } else if (error.code === 'auth/weak-password') {
        setError('密碼太弱。請使用更強的密碼。');
      } else {
        setError('Error during registration: ' + error.message);
      }
      console.error("Error during registration:", error);
    }
  };

  return (
    <div className='container'>
      <div className="row justify-content-center">
        <div className="col-6 py-5">
        {isRegistering ? (
 <h2>註冊帳號</h2>
        ):(<h2>登入帳號</h2>)
        }
         
          <div className='mb-2'>
            <label htmlFor="email" className="form-label w-100">email</label>
            <input
              id="email"
              className="form-control"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>
          <div className='mb-2'>
            <label htmlFor="password" className="form-label w-100">password</label>
            <input
              name="password"
              id="password"
              className="form-control"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {isRegistering ? (
            <button className='btn  btn-primary me-3' onClick={handleRegister}>註冊</button>
          ) : (
            <button className='btn btn-primary me-3 ' onClick={handleEmailLogin}>登入</button>
          )}
          <button className='btn btn-primary ' onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "已有帳號嗎" : "註冊"}
          </button>
        
          <div className='d-flex  mt-6 justify-content-center mt-4'>
            <button onClick={() => handleLogin(googleProvider)} className='text-white btn btn-primary btn-item-1'>
              <i className="bi bi-facebook me-3"></i>
              Facebook登入
            </button>
            <button
              type='submit'
              className='btn text-white ms-3 btn-primary  btn-item-1'
              onClick={() => handleLogin(facebookProvider)}>
              <i className="bi bi-google me-3"></i>
              google登入
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;