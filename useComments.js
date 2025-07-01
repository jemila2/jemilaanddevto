// Updated useComments.js
import { useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5003';

const useComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const endpoint = postId 
          ? `/api/comments?postId=${postId}`
          : '/api/comments';
        const response = await axios.get(endpoint);
        setComments(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  return { comments, loading, error };
};

export default useComments;