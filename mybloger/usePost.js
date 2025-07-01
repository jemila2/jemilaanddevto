
import { useEffect } from 'react';
import { useData } from '../context/DataContext';

export const usePosts = () => {
  const { posts, fetchPosts, isLoading, error } = useData();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        await fetchPosts();
      } catch (err) {
        console.error('Failed to load posts:', err);
      }
    };
    
    if (posts.length === 0) {
      loadPosts();
    }
  }, [fetchPosts, posts.length]);

  return { posts, isLoading, error, refreshPosts: fetchPosts };
};