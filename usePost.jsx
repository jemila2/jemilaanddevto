
// import { useState, useEffect, useCallback } from 'react';
// // import { useData } from '../context/DataContext'; // Fixed import path
// import { useData } from './src/context/DataContext';

// const usePosts = () => {
//   const { api } = useData();
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchPosts = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = localStorage.getItem('token');
//       const config = token ? {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       } : {};
      
//       // Remove one '/api' since your base URL likely already includes it
//       const response = await api.get('/blog', config);
      
//       if (response.data && Array.isArray(response.data.posts)) {
//         setPosts(response.data.posts);
//       } else {
//         throw new Error('Invalid posts data structure');
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       if (error.response?.status === 401) {
//         setError('Please login to view posts');
//       } else if (error.response?.status === 404) {
//         setError('Posts endpoint not found');
//       } else {
//         setError(error.message || 'Failed to fetch posts');
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [api]);

//   useEffect(() => {
//     fetchPosts();
//   }, [fetchPosts]);

//   return { 
//     posts, 
//     loading, 
//     error, 
//     fetchPosts 
//   };
// };

// export default usePosts;


import { useState, useEffect, useCallback } from 'react';
// import { useData } from './src/context/DataContext';
import { useData } from './src/context/DataContext';

const usePosts = () => {
  const { api } = useData();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 const fetchPosts = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params: {
        // Add any required query parameters
        page: 1,
        limit: 10
      }
    };
    
    // Use the exact endpoint from your backend routes
    const response = await api.get('/blog/all', config);
    
    // Handle different response structures
    const postsData = response.data.posts || response.data;
    if (!Array.isArray(postsData)) {
      throw new Error('Invalid posts data structure');
    }
    
    setPosts(postsData);
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    setError(error.response?.data?.message || error.message);
  } finally {
    setLoading(false);
  }
}, [api]);
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { 
    posts, 
    loading, 
    error, 
    fetchPosts,
    setPosts // Optional: if you need to update posts locally
  };
};

export default usePosts;