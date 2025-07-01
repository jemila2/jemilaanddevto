// // // const multer = require('multer');
// // // const path = require('path');

// // // // Create uploads directory if it doesn't exist
// // // const fs = require('fs');
// // // const uploadDir = 'uploads';
// // // if (!fs.existsSync(uploadDir)) {
// // //   fs.mkdirSync(uploadDir);
// // // }

// // // const storage = multer.diskStorage({
// // //   destination: (req, file, cb) => {
// // //     cb(null, uploadDir);
// // //   },
// // //   filename: (req, file, cb) => {
// // //     cb(null, `${Date.now()}-${file.originalname}`);
// // //   }
// // // });

// // // const fileFilter = (req, file, cb) => {
// // //   const filetypes = /jpeg|jpg|png|gif/;
// // //   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
// // //   const mimetype = filetypes.test(file.mimetype);

// // //   if (mimetype && extname) {
// // //     return cb(null, true);
// // //   }
// // //   cb(new Error('Only images are allowed'));
// // // };

// // // module.exports = multer({
// // //   storage,
// // //   fileFilter,
// // //   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// // // });

// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs');

// // // Create uploads directory if it doesn't exist
// // const uploadDir = 'uploads';
// // if (!fs.existsSync(uploadDir)) {
// //   fs.mkdirSync(uploadDir, { recursive: true });
// // }

// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, uploadDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //     cb(null, uniqueSuffix + path.extname(file.originalname));
// //   }
// // });

// // const fileFilter = (req, file, cb) => {
// //   const filetypes = /jpeg|jpg|png|gif/;
// //   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
// //   const mimetype = filetypes.test(file.mimetype);

// //   if (mimetype && extname) {
// //     return cb(null, true);
// //   }
// //   cb(new Error('Error: Only images are allowed (JPEG, JPG, PNG, GIF)'));
// // };

// // const upload = multer({
// //   storage,
// //   fileFilter,
// //   limits: { 
// //     fileSize: 5 * 1024 * 1024 // 5MB
// //   }
// // });

// // module.exports = upload;

// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });

// module.exports = upload;



// In FileUpload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});



module.exports = upload;