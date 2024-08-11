import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import Moment from 'react-moment';
import 'moment-timezone';
import 'moment/locale/zh-tw';
import { firestore } from '../firebase';
import Loading from '../components/Loading';

const PAGE_SIZE = 9; // 每页显示的文章数量

function Articles() {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0); // 新增总页数状态

    const fetchTotalPages = async () => {
        try {
            const articlesRef = collection(firestore, 'articles');
            const countQuery = query(articlesRef);
            const snapshot = await getCountFromServer(countQuery);
            const totalCount = snapshot.data().count;
            setTotalPages(Math.ceil(totalCount / PAGE_SIZE)); // 计算总页数
        } catch (error) {
            console.error("获取总页数失败:", error);
        }
    };

    const fetchArticles = async (page = 1) => {
        setIsLoading(true);
        try {
            const articlesRef = collection(firestore, 'articles');
            let articlesQuery = query(
                articlesRef,
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            );

            if (page > 1 && lastVisible) {
                articlesQuery = query(
                    articlesRef,
                    orderBy('createdAt', 'desc'),
                    startAfter(lastVisible),
                    limit(PAGE_SIZE)
                );
            }

            const querySnapshot = await getDocs(articlesQuery);
            const articlesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLastVisible(querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null);
            setArticles(articlesData);
            setHasMore(articlesData.length === PAGE_SIZE);
        } catch (error) {
            console.error("获取文章失败:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTotalPages(); // 獲取總頁數
    }, []);

    useEffect(() => {
        fetchArticles(currentPage); // 获取当前页的文章
    }, [currentPage]);

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return pages;
    };

    return (
        <div className="container mt-5">
            <Loading isLoading={isLoading} />
            <h2 className="text-center mb-4">文章列表</h2>
            <div className="row">
                {articles.map(article => (
                    <div key={article.id} className="col-12 col-md-6 col-lg-4 mb-4">
                        <Link to={`/articledetail/${article.id}`} className="card h-100 shadow-sm text-decoration-none">
                            {article.imageUrls && article.imageUrls.length > 0 && (
                                <img 
                                    src={article.imageUrls[0]} 
                                    className="card-img-top" 
                                    alt={article.title}
                                    style={{ height: '300px', objectFit: 'cover' }}
                                />
                            )}
                            <div className="card-body">
                                <h5 className="card-title">{article.title}</h5>
                                <p className="card-text">{article.content}</p>
                                <p className="text-muted">作者: {article.author.displayName}</p>
                                <p className="text-muted">
                                    <Moment fromNow>{new Date(article.createdAt.seconds * 1000)}</Moment>
                                </p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
            <nav aria-label="Page navigation">
                <ul className="pagination d-flex justify-content-center mt-4">
                    <li className="page-item">
                        <button
                            className="page-link"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prevPage => prevPage - 1)}
                        >
                            上一頁
                        </button>
                    </li>
                    {renderPageNumbers().map((page, index) => (
                        <li key={index} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                            {page === '...' ? (
                                <span className="page-link">...</span>
                            ) : (
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            )}
                        </li>
                    ))}
                    <li className="page-item">
                        <button
                            className="page-link"
                            disabled={currentPage === totalPages || !hasMore}
                            onClick={() => setCurrentPage(prevPage => prevPage + 1)}
                        >
                            下一頁
                        </button>
                    </li>
                    <li className="page-item">
                        <span className="page-link">共 {totalPages}頁</span>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default Articles;
