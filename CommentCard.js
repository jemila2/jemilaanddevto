// CommentCard.jsx
import { Link } from 'react-router-dom';
import placeholderImage from '../assets/placeholder.jpg';

const CommentCard = ({ comment }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-start gap-3">
        <img 
          src={comment.author?.avatar || placeholderImage}
          alt={comment.author?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{comment.author?.name}</span>
              <span className="text-gray-500 text-xs ml-2">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <Link 
              to={`/post/${comment.post?._id}`}
              className="text-blue-500 text-sm hover:underline"
            >
              View Post
            </Link>
          </div>
          <p className="text-gray-700 mt-2">{comment.text}</p>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;