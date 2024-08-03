import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ref, deleteObject } from 'firebase/storage';
import { doc, getDoc, collection, addDoc, query, orderBy, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { firestore, storage } from '../firebase';
import Loading from '../components/Loading';
import LazyLoad from 'react-lazyload';
import Moment from 'react-moment';
import 'moment-timezone';
import 'moment/locale/zh-tw';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createAsyncMessage } from '../Silce/messageSlice';
import MessageToast from '../components/MessageToast';
import ImgModal from '../components/ImgModal';

const ArticleDetail = ({ user }) => {
    const { id } = useParams();// 取得 URL 中的文章 ID 參數
    const [article, setArticle] = useState(null); // 儲存文章資料
    const [replies, setReplies] = useState([]); // 儲存回覆資料
    const [newReply, setNewReply] = useState('');// 儲存新的回覆內容
    const [isModalOpen, setIsModalOpen] = useState(false);// 控制圖片模態框的顯示
    const [isLoading, setIsLoading] = useState(true);// 控制載入狀態
    const [photoIndex, setPhotoIndex] = useState(0);// 控制顯示的圖片索引
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 使用 useEffect 獲取文章詳細資訊
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const docRef = doc(firestore, 'articles', id);// 指定文章的 Firestore
                const docSnap = await getDoc(docRef);// 獲取文章文檔
                if (docSnap.exists()) {
                    setArticle(docSnap.data()); // 設置文章資料
                } else {
                    console.error("文章未找到");
                }
            } catch (error) {
                console.error("獲取文章錯誤:", error);
            } finally {
                setIsLoading(false); // 完成後設置載入狀態
            }
        };

        fetchArticle();
    }, [id]);// 條件是id 當id不一樣重新載入

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(firestore, 'articles', id, 'replies'),
            query => {
                const repliesList = query.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setReplies(repliesList); // 更新回覆資料
            },
            error => {
                console.error("更新回覆失败:", error);
            }
        );

        return () => unsubscribe();
    }, [id]);


    // 刪除文章及其圖片的處理函數
    const handleDeleteArticle = async () => {
        if (window.confirm('確定要刪除這篇文章嗎？')) {
            setIsLoading(true);

            // 獲取圖片的 URL 列表
            const imageUrls = article.imageUrls || [];

            try {
                // 删除存储中的图片
                const deleteImagePromises = imageUrls.map(async (url) => {
                    try {
                        // 構建Firebase Storage 中图片的引用路径
                        const imageRef = ref(storage, url);
                        await deleteObject(imageRef);
                        console.log(`圖片已删除: ${url}`);
                    } catch (error) {
                        if (error.code === 'storage/object-not-found') {
                            console.warn(`圖片不存在: ${url}`);
                        } else {
                            console.error(`删除圖片發生错误: ${url}`, error);
                        }
                    }
                });
                await Promise.all(deleteImagePromises);

                // 删除文章文档
                const articleRef = doc(firestore, 'articles', id);
                await deleteDoc(articleRef);

                console.log("文章及相關圖片已删除");
                navigate('/articles');
            } catch (error) {
                console.error("删除文章时發生错误:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleReplySubmit = async () => {
        if (newReply.trim()) {
            try {
                await addDoc(collection(firestore, 'articles', id, 'replies'), {
                    text: newReply,
                    createdAt: serverTimestamp(),
                    user: {
                        uid: user.uid,
                        displayName: user.displayName || user.email,
                    },
                });
                setNewReply('');// 清空回覆輸入框
                dispatch(createAsyncMessage({
                    success: true,
                    message: '回覆成功',
                }));
            } catch (error) {
                dispatch(createAsyncMessage({
                    success: false,
                    message: '回覆失敗',
                }));
            }
        }
    };

    const handleImageClick = (index) => {
        setPhotoIndex(index);
        setIsModalOpen(true);
    };

    const handlePrev = () => {
        setPhotoIndex((photoIndex + article.imageUrls.length - 1) % article.imageUrls.length);
    };

    const handleNext = () => {
        setPhotoIndex((photoIndex + 1) % article.imageUrls.length);
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    const handleDeletereply = async (replyId) => {
        const replyToDelete = replies.find(msg => msg.id === replyId);

        if (replyToDelete) {
            // 確保用戶的 uid 與回覆中的用戶 uid 匹配
            if (replyToDelete.user.uid === user.uid) {
                try {
                    await deleteDoc(doc(firestore, 'articles', id, 'replies', replyId));
                    dispatch(createAsyncMessage({
                        success: true,
                        message: '刪除訊息成功',
                    }));
                } catch (error) {
                    dispatch(createAsyncMessage({
                        success: false,
                        message: '刪除訊息失敗',
                    }));
                }
            }
        }
    };

    return (
        <div className="container">
            <MessageToast />
            <Loading isLoading={isLoading} />
            <div className='d-flex justify-content-between align-items-center'>
                <h2>{article?.title}</h2>
                {user && user.uid === article?.author.uid && (
                    <button
                        className="btn btn-danger"
                        onClick={handleDeleteArticle}
                    >
                        刪除文章
                    </button>
                )}
            </div>
            <p className="text-muted">作者: {article?.author.displayName}</p>
            <p className="text-muted">
                <Moment fromNow>{new Date(article?.createdAt.seconds * 1000)}</Moment>
            </p>
            {article?.imageUrls && article?.imageUrls.length > 0 && (
                <div className="image-gallery">
                    <LazyLoad
                        height={300} // Adjust height as needed
                        offset={100}
                        placeholder={<div style={{ height: '300px', backgroundColor: '#f0f0f0' }}></div>}
                    >
                        <img
                            src={article?.imageUrls[0]}
                            className="img-fluid main-image mb-3"
                            alt={article?.title}
                            onClick={() => handleImageClick(0)}
                            loading="lazy"
                        />
                    </LazyLoad>
                    <div className="row mt-3">
                        {article?.imageUrls.slice(1, 4).map((imageUrl, index) => (
                            <div key={index} className="col-3 mb-3 p-1">
                                <LazyLoad
                                    height={100} // Adjust height as needed
                                    offset={100}
                                    placeholder={<div style={{ height: '100px', backgroundColor: '#f0f0f0' }}></div>}
                                >
                                    <img
                                        src={imageUrl}
                                        className="img-thumbnail small-image"
                                        alt={`${article?.title} ${index + 1}`}
                                        onClick={() => handleImageClick(index + 1)}
                                        loading="lazy"
                                    />

                                </LazyLoad>
                            </div>
                        ))}
                        {article?.imageUrls.length > 4 && (
                            <div className="col-3 mb-3 position-relative p-1">
                                <LazyLoad
                                    height={100} // Adjust height as needed
                                    offset={100}
                                    placeholder={<div style={{ height: '100px', backgroundColor: '#f0f0f0' }}></div>}
                                >

                                    <img
                                        src={article?.imageUrls[4]}
                                        className="img-thumbnail small-image"
                                        alt={`${article?.title} 5`}
                                        onClick={() => handleImageClick(4)}
                                        loading="lazy"
                                    />
                                </LazyLoad>
                                {article?.imageUrls.length > 5 && (
                                    <div className="overlay">
                                        還有 {article?.imageUrls.length - 5} 張照片
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <p>{article?.content}</p>
            <h4>回覆</h4>
            <div>
                <input
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="輸入你的回覆"
                    className="form-control mb-2"
                />
                <button onClick={handleReplySubmit} className="btn btn-primary mt-2">回覆</button>
            </div>

            <ul className="list-group mt-5 min-vh-100">
                {replies.map(reply => (
                    <li key={reply.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{reply.user.displayName || reply.user.email}</strong>
                                <span className="text-muted ms-2">
                                    <Moment fromNow>{reply.createdAt?.toDate()}</Moment>
                                </span>
                            </div>
                            {user && user.uid === reply.user.uid && (
                                <button
                                    className="btn btn-danger btn-sm ms-3"
                                    onClick={() => handleDeletereply(reply.id)}
                                >
                                    刪除
                                </button>
                            )}
                        </div>
                        <p className="mb-0">{reply.text}</p>
                    </li>
                ))}
            </ul>
            <ImgModal
                show={isModalOpen}
                handleClose={handleClose}
                imageUrls={article?.imageUrls || []}
                photoIndex={photoIndex}
                handlePrev={handlePrev}
                handleNext={handleNext}
            />
        </div>
    );
};

export default ArticleDetail;
