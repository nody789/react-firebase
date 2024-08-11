import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { addDoc, collection, serverTimestamp, doc, updateDoc,increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase';
import Loading from '../components/Loading';
import { Input, Textarea } from '../components/FormElememts';
import { createAsyncMessage } from '../Silce/messageSlice';

const CreatePost = ({ user }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });
  const progressBarRefs = useRef([]);
  const dispatch = useDispatch();

  // 處理圖片上傳
  const handleImageUpload = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setImages(prevImages => prevImages.concat(filesArray));
      Array.from(e.target.files).forEach(file => URL.revokeObjectURL(file)); // 释放之前创建的对象 URL
    }
  };

  // 處理刪除已上傳的圖片
  const handleImageDelete = (imageUrl) => {
    setImages(images.filter(image => image !== imageUrl));
  };

  // 發布文章
  const handlePublish = async (data) => {
    const { title, content } = data;
    if (title.trim() && content.trim() && images.length > 0) { // 确保标题、内容和至少一张图片存在
      setIsLoading(true);
      try {
        // 先创建文章文擋獲取文章ID
        const articleRef = await addDoc(collection(firestore, 'articles'), {
          title,
          content,
          createdAt: serverTimestamp(),
          author: {
            uid: user.uid,
            displayName: user.displayName || user.email,
          },
        });

        const articleId = articleRef.id;//獲取文章id
        const imageUrls = [];
        const uploadPromises = images.map((image, index) => {
          const imageRef = ref(storage, `articles/${articleId}/${new Date().getTime()}_${index}`);
          return fetch(image)
            .then(res => res.blob())
            .then(blob => {
              const uploadTask = uploadBytesResumable(imageRef, blob);

              return new Promise((resolve, reject) => {
                uploadTask.on(
                  'state_changed',
                  (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (progressBarRefs.current[index]) {
                      progressBarRefs.current[index].style.width = `${progress}%`;
                    }
                  },
                  (error) => {
                    console.error(`Error uploading image ${index + 1}:`, error);
                    reject(error);
                  },
                  async () => {
                    const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    imageUrls.push(imageUrl);
                    resolve(imageUrl);
                  }
                );
              });
            });
        });

        await Promise.all(uploadPromises);

        // 更新文章文档中的图片URL
        await updateDoc(doc(firestore, 'articles', articleId), {
          imageUrls,
          articleId,
        });
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
          articleCount: increment(1),
        });
        setIsLoading(false);
        dispatch(createAsyncMessage({
            success: true,
            message: '文章發布成功',
        }));
        setTimeout(() => {
            navigate('/articles');
        }, 3000);
      } catch (error) {
        console.error("Error uploading images:", error);
        setIsLoading(false);
        dispatch(createAsyncMessage({
            success: false,
            message: '文章發布失敗',
        }));
      }
    } else {
      // 提示用户需要填写完整的标题、内容和至少一张图片才能发布文章
      dispatch(createAsyncMessage({
        success: false,
        message: '完整的標题、内容和至少一張圖片！',
      }));
    }
  };

  return (
    <div className="container">
      <Loading isLoading={isLoading} />
      <h2>發布文章</h2>
      <form onSubmit={handleSubmit(handlePublish)}>
        <div className="mb-3">
          <Input
            id="title"
            type="text"
            errors={errors}
            labelText="標题"
            register={register}
            rules={{
              required: '標題為必填',
              maxLength: {
                value: 10,
              },
            }}
          />
        </div>
        <div className="mb-3">
          <Textarea
            id="content"
            type="text"
            errors={errors}
            labelText="内容"
            register={register}
            placeholder="内容"
            rows="5"
            rules={{
              required: '内容為必填',
            }}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="images" className="form-label">圖片上傳</label>
          <input
            id="images"
            className="form-control"
            type="file"
            multiple
            onChange={handleImageUpload}
          />
        </div>
        <div className="mb-3">
          <div className="row">
            {images?.map((image, index) => (
              <div key={index} className="col-3 mb-3">
                <img
                  src={image}
                  alt={`upload-${index}`}
                  className="img-thumbnail"
                  style={{ maxHeight: '150px', objectFit: 'cover' }}
                />
                <div className="progress mt-2">
                  <div
                    ref={el => progressBarRefs.current[index] = el}
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: '0%' }}
                    aria-valuenow="0"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm mt-2"
                  onClick={() => handleImageDelete(image)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary">發布</button>
      </form>
    </div>
  );
};

export default CreatePost;
