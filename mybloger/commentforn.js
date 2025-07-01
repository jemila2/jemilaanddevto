
const response = await axios.post(
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003'}/api/blog/comment/${postId}`,
  { 
    text: commentText,
    author: user._id
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);