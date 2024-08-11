import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase';
import { useForm } from 'react-hook-form';
import { updateUser } from '../Silce/userSlice';
import Loading from '../components/Loading';
import { createAsyncMessage } from '../Silce/messageSlice';

const UserProfile = () => {
  const user = useSelector((state) => state.user.user); //  Redux Store 獲取用戶
  const [userData, setUserData] = useState(null); // 儲存用戶數據
  const [articleCount, setArticleCount] = useState(0); // 存储文章数量
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState(null); // 上傳的頭像
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const dispatch = useDispatch();

  // 定義 用戶個人資料 fetchUserData 函数
  const fetchUserData = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setValue('email', data.email);
          setValue('displayName', data.displayName);
          setValue('birthdate', data.birthdate);
          setValue('bio', data.bio);
        } else {
          console.error('No such user document!');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false); // 確認在操作完設置 isLoading 為 false
        //finally:  try 是否發生錯誤，finally 的代碼都會執行，通常用於清理操作，例如更新 UI 狀態。setIsLoading(false) 確保在操作完成（無論成功还是失败）将加载狀態設定 false
      }
    } else {
      console.error('User is not defined');
      setIsLoading(false);
    }
  };

  // 定義 fetchArticleCount 函数
  const fetchArticleCount = async () => {
    if (user) {
      try {
        const articlesQuery = query(
          collection(firestore, 'articles'),
          where('author.uid', '==', user.uid)
        );
        const articlesSnapshot = await getDocs(articlesQuery);
        setArticleCount(articlesSnapshot.size);
      } catch (error) {
        console.error("Error fetching article count:", error);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchArticleCount();
  }, [user, setValue]);

  // 上傳頭像
  const handleImageUpload = async (file) => {
    const imageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(imageRef, file);
    const avatarUrl = await getDownloadURL(imageRef);
    return avatarUrl;
  };

  // 更新用户信息
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      let avatarUrl = userData.avatarUrl;
      if (image) {
        avatarUrl = await handleImageUpload(image);
      }

      const userRef = doc(firestore, 'users', user.uid);

      // 創建更新的对象
      const updateData = {
        displayName: data.displayName,
        birthdate: data.birthdate,
        bio: data.bio,
        ...(avatarUrl && { avatarUrl })
      };

      // 更新用户數據
      await updateDoc(userRef, updateData);

      // 更新與用戶關聯的所有文章中的作者信息
      const articlesRef = collection(firestore, 'articles');
      const userArticlesQuery = query(articlesRef, where('author.uid', '==', user.uid));
      const querySnapshot = await getDocs(userArticlesQuery);
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        const articleRef = doc.ref;
        batch.update(articleRef, {
          'author.displayName': updateData.displayName,
          ...(avatarUrl && { 'author.avatarUrl': avatarUrl })
        });
      });
      await batch.commit();

      // 更新 Redux store 中的用户数据
      dispatch(updateUser({
        displayName: updateData.displayName,
        birthdate: updateData.birthdate,
        bio: updateData.bio,
        avatarUrl: updateData.avatarUrl || userData.avatarUrl,
        lastLogin: new Date().toISOString(), // Example: current time
      }));

      // 提示用户资料更新成功
      dispatch(createAsyncMessage({
        success: true,
        message: '個人資料已更新',
      }));

      // 重新获取用户数据以更新组件状态
      await fetchUserData();
    } catch (error) {
      dispatch(createAsyncMessage({
        success: false,
        message: '個人資料更新失敗',
      }));
      console.error("Error updating user data:", error);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="container user-profile">
      <Loading isLoading={isLoading} />
      <div className="card user-profile-card">
        <div className="card-body">
          <div className="user-profile-header">
            <h2>個人資料</h2>
            {userData && (
              <img
                src={userData.avatarUrl || user.photoURL}
                alt="Avatar"
                className="img-thumbnail user-profile-avatar"
              />
            )}
          </div>
          {userData && (
            <div className="user-profile-details">
              <p>電子信箱: {userData.email}</p>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="user-profile-form">
                  <div className="mb-3">
                    <label htmlFor="displayName" className="form-label">姓名</label>
                    <input
                      type="text"
                      className="form-control"
                      id="displayName"
                      {...register('displayName', { required: '姓名为必填' })}
                    />
                    {errors.displayName && <p className="text-danger">{errors.displayName.message}</p>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="birthdate" className="form-label">生日</label>
                    <input
                      type="date"
                      className="form-control"
                      id="birthdate"
                      {...register('birthdate')}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">自我介紹</label>
                    <textarea
                      className="form-control"
                      id="bio"
                      {...register('bio')}
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="avatar" className="form-label">頭像照片</label>
                    <input
                      type="file"
                      className="form-control"
                      id="avatar"
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                  </div>
                  <button className="btn btn-primary" type="submit">保存</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setIsEditing(false)}>取消</button>
                </form>
              ) : (
                <div>
                  <p>姓名: {userData.displayName}</p>
                  <p>生日: {userData.birthdate}</p>
                  <p>自我介紹: {userData.bio}</p>
                  <p className="text-dark">發佈 {articleCount} 篇文章</p>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>编辑</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
