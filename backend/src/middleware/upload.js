const multer = require("multer");

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".xlsx")) {
      const err = new Error("Only .xlsx files are allowed");
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});