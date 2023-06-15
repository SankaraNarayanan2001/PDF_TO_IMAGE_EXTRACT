const router=require('express').Router();

const userControllers=require('../controllers/userControllers');

const jwtCheck=require('../middleware/jwt');

const validation=require('../middleware/validation');

const multer=require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'D:/extract-images-pdf/multerOut/'); // Specify the directory to save the uploaded files
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = file.originalname;
      cb(null, uniqueSuffix);
    },
  });
  
  const upload = multer({ storage })


router.route('/signup').post(validation,userControllers.SIGNUP);

router.route('/login').post(userControllers.LOGIN)

router.route('/getdata').get(jwtCheck,userControllers.GET_DATA);

router.route('/pdftoimage').get(upload.single("file"),userControllers.PDF_IMAGE);

router.route('/preview/:imageName').get(userControllers.PREVIEW);

router.route('/upload/:userId').post(jwtCheck,upload.single('image'),userControllers.UPLOAD);

router.route('/update/:userId').patch(jwtCheck,userControllers.UPDATE)

router.route('/delete/:userId').delete(jwtCheck,userControllers.DELETE_IMAGE);

router.route('/Admin').get(jwtCheck,userControllers.GET_ALL);

module.exports=router;