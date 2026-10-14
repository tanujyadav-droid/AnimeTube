import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./Public/temp")
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '_' + Math.round(Math.random()*1E9)
      cb(null, file.originalname + '_' + uniqueSuffix)
    }
  })
  
export const upload = multer({ 
    storage
})