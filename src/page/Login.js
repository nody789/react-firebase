import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, facebookProvider, firestore } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { Input } from '../components/FormElememts'; // Ensure correct import path
import { useDispatch } from 'react-redux';
import { setUser } from '../Silce/userSlice'; // Import your user slice action

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');//錯誤訊息
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
     // 監聽用户身份狀態變化
     // Firebase Authentication 提供的函数，註冊一个監聽来監控用户的身份驗證狀態變化。
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
  
        if (!userDoc.exists()) {
          // 如果用戶文檔不存在，創建它
          await setDoc(userDocRef, {
            uid: user.uid,
            displayName: user.displayName || user.email,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(), // 只在 Firestore 中使用
          });
        } else {
          // 只更新 lastLogin
          await setDoc(userDocRef, {
            lastLogin: serverTimestamp(), // 只在 Firestore 中使用
          }, { merge: true });
        }
  
        // 獲取用戶數據，只包括基本數據
        const userData = userDoc.data();
        dispatch(setUser({
          uid: userData.uid,
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
        }));
        navigate("/messages");
      } else {
        console.log("No user logged in");
      }
    });
  
    return () => unsubscribe();// 清除訂閱
  }, [dispatch, navigate]);
  

  const handleLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        // 如果用戶文檔不存在，創建它
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName || user.email,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(), // 這個只用於 Firebase 中
        });
      } else {
        // 只更新 lastLogin
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp(), // 這個只用於 Firebase 中
        }, { merge: true });
      }
  
      setUser(user);
      navigate("/messages");
    } catch (error) {
      console.error("Error during sign in:", error);
      setError('登入失敗，請重試。');
    }
  };

  const handleEmailLogin = async (data) => {
    try {
      const { email, password } = data;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
  
      // 獲取用戶數據，只包括基本數據
      const userData = userDoc.data();
      dispatch(setUser({
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
      }));
      navigate("/messages");
    } catch (error) {
      console.error("Error during email sign in:", error);
      if (error.code === 'auth/user-not-found') {
        setError('用户不存在。请檢查您的電子郵件和密碼。');
      } else if (error.code === 'auth/wrong-password') {
        setError('密碼錯誤。請重新输入。');
      } else {
        setError('登入失敗，請重試。');
      }
    }
  };

  const handleRegister = async (data) => {
    try {
      const { email, password } = data;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);

      // Create user document
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: email.split('@')[0], // Default to part before '@' in email
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      });

      // Fetch user data from Firestore
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      dispatch(setUser(userData));
      navigate("/messages");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('該電子邮件已被使用。请使用不同的電子郵件。');
      } else if (error.code === 'auth/weak-password') {
        setError('密码太弱。請使用更強的密碼。');
      } else {
        setError('註冊失敗，請重試。');
      }
      console.error("Error during registration:", error);
    }
  };

  return (
    <div className='container'>
      <div className="row justify-content-center">
        <div className="col-6 py-5">
          <h2>{isRegistering ? "註冊帳號" : "登入帳號"}</h2>
          {/* // 當表單提交时，根據 isRegistering 的值决定调用哪个處理函數
          // handleSubmit 函数将表單數據傳遞给相對的處理函数（註冊或登入） */}
          <form onSubmit={handleSubmit(isRegistering ? handleRegister : handleEmailLogin)}>
            <Input
              id="email"
              type="email"
              labelText="電子郵件"
              placeholder="Email"
              register={register}
              errors={errors}
              rules={{ required: '電子郵件為必填' }}
            />
            <Input
              id="password"
              type="password"
              labelText="密碼"
              placeholder="Password"
              register={register}
              errors={errors}
              rules={{ required: '密碼為必填' }}
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button 
              className='btn btn-primary me-3 ' 
              type="submit"
            >
              {isRegistering ? "註冊" : "登入"}
            </button>
            <button 
              className='btn btn-secondary' 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "已有帳號？登入" : "没有帳號？註冊"}
            </button>
          </form>
          <div className='d-flex mt-4 justify-content-center'>
            <button 
              className='btn btn-primary me-3' 
              onClick={() => handleLogin(googleProvider)}
            >
              <i className="bi bi-google me-2"></i>
              Google 登入
            </button>
            <button 
              className='btn btn-primary' 
              onClick={() => handleLogin(facebookProvider)}
            >
              <i className="bi bi-facebook me-2"></i>
              Facebook 登入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
