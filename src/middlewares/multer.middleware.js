import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./Public/temp");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, `${base}_${uniqueSuffix}${ext}`); // avatar_1699_482.png
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, in bytes
});

// import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./Public/temp")
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '_' + Math.round(Math.random()*1E9)
//       cb(null, file.originalname + '_' + uniqueSuffix)
//     }
//   })
  
// export const upload = multer({ 
//     storage
// })