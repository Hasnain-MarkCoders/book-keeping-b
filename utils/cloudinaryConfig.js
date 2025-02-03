const cloudinary = require('cloudinary').v2;

          
cloudinary.config({ 
  cloud_name: 'deukwoccj', 
  api_key: '136457437591553', 
  api_secret: 'WW7bxWPljMiNiElJaHIVWRC117A' 
});
const multer = require("multer");

const storage = multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
exports.cloud_upload = cloudinary.uploader
exports.upload = multer({ storage: storage })