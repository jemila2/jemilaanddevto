

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    validate: {
      validator: function(v) {
        // Basic URL validation or file path validation
        return v === null || typeof v === 'string';
      },
      message: props => `${props.value} is not a valid image path!`
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
   likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  comments: [{
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      minlength: [2, 'Comment must be at least 2 characters'],
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Virtual for image URL
postSchema.virtual('imageUrl').get(function() {
  if (!this.image) return null;
  return this.image.startsWith('http') 
    ? this.image 
    : `${process.env.BASE_URL || 'http://localhost:5003'}/${this.image.replace(/\\/g, '/')}`;
});

module.exports = mongoose.model('Post', postSchema);