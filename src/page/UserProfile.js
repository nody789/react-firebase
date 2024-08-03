import  { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { doc, getDoc, updateDoc, collection, query, where, getDocs,writeBatch  } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase';
import { useForm } from 'react-hook-form';
import Loading from '../components/Loading';
import { createAsyncMessage } from '../Silce/messageSlice';

const UserProfile = ({ user }) => {
  const [userData, setUserData] = useState(null); // 用于存储用户登入的状态
  const [articleCount, setArticleCount] = useState(0);//儲存文章數量
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState(null);// 上傳的頭像圖片
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchUserData = async () => {
      // 获取用户登入資訊
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('User data:', data); // 调试信息
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
        }finally {
          setIsLoading(false); // 確保在異步操作完成後設置 isLoading 為 false
        }
      } else {
        console.error('User is not defined');
        setIsLoading(false);
      }
    };

    // 獲取文章数量
    const fetchArticleCount = async () => {
      if (user) {
        try {
          const articlesQuery = query(
            collection(firestore, 'articles'),
            where('author.uid', '==', user.uid)
          );
          const articlesSnapshot = await getDocs(articlesQuery);
          console.log('文章數量:', articlesSnapshot.size);
          setArticleCount(articlesSnapshot.size);
        } catch (error) {
          console.error("Error fetching article count:", error);
        }
      }
    };

    fetchUserData();
    fetchArticleCount();
  }, [user, setValue]);

  //上傳頭像圖像
  const handleImageUpload = async (file) => {
    const imageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(imageRef, file);
    const avatarUrl = await getDownloadURL(imageRef);
    return avatarUrl;
  };

  //更新用戶訊息
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      let avatarUrl = userData.avatarUrl;
      if (image) {
        avatarUrl = await handleImageUpload(image);
      }

      const userRef = doc(firestore, 'users', user.uid);

      // 创建更新的对象
      const updateData = {
        displayName: data.displayName,
        birthdate: data.birthdate,
        bio: data.bio
      };

      // 仅在 avatarUrl 存在时才添加到更新数据中
      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }
      ///更新用戶
      await updateDoc(userRef, updateData);
      // 更新与用户关联的所有文章中的作者信息
      // 獲取 'articles' 集合的引用
      const articlesRef = collection(firestore, 'articles');
      // 創建一個查詢对象，查询所有 'articles' 集合中 'author.uid' 等於當前用户 uid 的文章
      //这里创建了一个查询对象 userArticlesQuery，用于查找 'articles' 集合中 'author.uid' 等于當前用户 uid 的所有文档。
      const userArticlesQuery = query(articlesRef, where('author.uid', '==', user.uid));
      // 執行查詢並獲取查询结果
      //通過调用 getDocs 函数执行查询，並獲取查询结果的快照 querySnapshot，其中包含了所有符合查询条件的文黨。
      const querySnapshot = await getDocs(userArticlesQuery);
      // 创建一个 Firestore 批量操作对象
      const batch = writeBatch(firestore);
        // 遍历查询结果中的每个文档
      querySnapshot.forEach((doc) => {
          // 获取每个文档的引用
        const articleRef = doc.ref;
        batch.update(articleRef, {
              // 更新 'author.displayName' 字段为新的 displayName
          'author.displayName': updateData.displayName,
              // 如果 avatarUrl 存在，更新 'author.avatarUrl' 字段为新的 avatarUrl
          ...(avatarUrl && { 'author.avatarUrl': avatarUrl })
        });
      });
      await batch.commit();
      setUserData((prevData) => ({
        ...prevData,
        ...updateData,
        avatarUrl: avatarUrl || prevData.avatarUrl,
      }));
      dispatch(createAsyncMessage({
        success: true,
        message: '個人資料已更新',
    }));
    setIsLoading(false);
    setIsEditing(false);
    } catch (error) {
      dispatch(createAsyncMessage({
        success: false,
        message: '個人資料更新失敗',
    }));
      console.error("Error updating user data:", error);
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
              <p>信箱: {userData.email}</p>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="user-profile-form">
                  <div className="mb-3">
                    <label htmlFor="displayName" className="form-label">姓名</label>
                    <input
                      type="text"
                      className="form-control"
                      id="displayName"
                      {...register('displayName', { required: '姓名為必填' })}
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
                    <label htmlFor="bio" className="form-label">簡介</label>
                    <textarea
                      className="form-control"
                      id="bio"
                      {...register('bio')}
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="avatar" className="form-label">大頭貼照片</label>
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
                  <p>簡介: {userData.bio}</p>
                  <p className="text-dark">發布了 {articleCount} 篇文章</p>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>編輯</button>
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
