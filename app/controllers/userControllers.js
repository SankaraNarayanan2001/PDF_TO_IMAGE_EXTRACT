const User = require('../model/userTable');

const Image = require('../model/imageTable');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');

const pdfPoppler = require('pdf-poppler');

const appError = require('../utils/appError');

const asyncErrorHandler = require('../utils/asyncErrorHandler');

const fs = require('fs');

const path = require('path');

const SIGNUP = asyncErrorHandler(async (req, res, next) => {
  const { Email, Password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(Password, salt);
  if (!Email && !Password) {
    return next(new appError(400, "Email and password are required"));
  }

  User.create({ Email, Password: hashedPassword })
    .then((user) => {
      res.status(201).json({
        status: "success",
        message: "successfully sign up",
        data: {
          user
        }
      });
    })



})

// login

const LOGIN = asyncErrorHandler(async (req, res, next) => {

  const { Email, Password } = req.body;


  const user = await User.findOne({ where: { Email } });

  if (!user) {
    return next(new appError(404, "User not found"))
  }

  const passwordMatch = await bcrypt.compare(Password, user.Password);

  if (!passwordMatch) {
    return next(new appError(404, "Invalid Password"))
  }

  const token = jwt.sign({ Email }, 'Login');
  res.status(200).json({
    status: "success",
    message: "Login successfull",
    data: {
      token
    }
  });

});


// Route to get the number of images for a user
const GET_DATA = async (req, res) => {
  try {
    const email = req.user;

    // Retrieve the user from the database
    const user = await User.findOne({
      where: { Email: email },
      include: {
        model: Image,
        attributes: ['Image_id', 'FileName'],
      },
    });

    if (!user) {
      return next(new appError(404, "user not found"))
    }

    const response = {
      email: user.Email,
      images: user.Images.map((image) => ({
        image_id: image.Image_id,
        filename: image.FileName,
        url: `http://localhost:4000/preview/${image.FileName}`,
      })),
    };

    res.status(200).send({
      status: "success",
      data: {
        response
      }
    })

  } catch (error) {
    console.log("error", error.message);
  }


};



//PDF TO IMAGE
const PDF_IMAGE = async (req, res, next) => {

  const file = req.file;


  const pdfPath = file.destination + `${file.originalname}`;
  const outputDir = 'D:/extract-images-pdf/out/';



  const options = {
    format: 'png', // Image format (png, jpeg, or tiff)
    out_dir: outputDir, // Output directory for extracted images
    out_prefix: 'image_', // Prefix for extracted image files
    page: null // Page number to extract images from (null to extract from all pages)
  };


  pdfPoppler.convert(pdfPath, options)

  const files = await fs.promises.readdir(outputDir);

  console.log(files);

  const userCount = await User.count();

  console.log(userCount);

  const userIds = Array.from({ length: userCount }, (_, index) => index + 1);
  console.log(userIds);

  Promise.all(files.map((file, index) =>
    Image.create({
      FileName: file,
      UserId: userIds[index % userCount]

    })
  ))

  res.status(200).json({
    status: "success",
    message: "Image extracted and saved in database successfully"
  });
}



const PREVIEW = (req, res, next) => {
  const imageName = req.params.imageName;
  const imageFilePath = path.resolve('D:/extract-images-pdf/out/', imageName);

  // Set the response headers for image preview
  res.set('Content-Type', 'image/png');
  res.set('Content-Disposition', `inline; filename="${imageName}"`);

  // Send the image file as the response
  res.sendFile(imageFilePath, (error) => {
    if (error) {

      return next(new appError(404, 'unable to preview'));
    }
  });
};

//UPLOAD
const UPLOAD = async (req, res, next) => {

  const file = req.file;
  const email = req.user;
  const userIdFromParams = parseInt(req.params.userId);

  const user = await User.findOne({
    where: { Email: email },
  });

  if (user.User_id !== userIdFromParams) {
    return next(new appError(403, 'Unauthorized access'));
  }

  const image = await Image.findOne({ where: { UserId: user.User_id, FileName: file.originalname } });

  if (image) {
    return next(new appError(404, 'Image Already Exist'));
  }
  else {
    // Create a new image with the uploaded file
    const image = await Image.create({ FileName: file.originalname, UserId: user.User_id });
  }

  res.status(200).json({
    status: "success",
    message: 'Image updated successfully',

  });
};


// UPDATE 
const UPDATE = asyncErrorHandler(async (req, res, next) => {

  const { Image_id, NewFileName } = req.body;
  const email = req.user;
  const userIdFromParams = parseInt(req.params.userId);

  // Find the user in the database
  const user = await User.findOne({ where: { Email: email } });


  if (!user) {
    return next(new appError(404, 'User not found'));
  }

  if (user.User_id !== userIdFromParams) {
    return next(new appError(403, 'Unauthorized access'));
  }

  // Find the image to update
  const image = await Image.findOne({ where: { Image_id, UserId: user.User_id } });


  if (!image) {
    return next(new appError(404, 'Image not found'));
  }

  // Check if an image with the same NewFileName already exists for the user
  const existingImage = await Image.findOne({ where: { UserId: user.User_id, FileName: NewFileName } });

  if (existingImage) {
    return next(new appError(409, 'Image with the same NewFileName already exists'));
  }

  // Rename the image
  const currentFilePath = path.join('D:/extract-images-pdf/out', image.FileName);
  const newFilePath = path.join('D:/extract-images-pdf/out', NewFileName);

  fs.renameSync(currentFilePath, newFilePath);

  // Update the image details in the database
  const updatedImage = await image.update({ FileName: NewFileName });

  res.status(200).json({
    status: "success",
    message: 'Image updated successfully',
    data: {
      Image: updatedImage
    }
  });
});



//DELETE
const DELETE_IMAGE = asyncErrorHandler(async (req, res, next) => {

  const { Image_id } = req.body;
  const Email = req.user;
  const userIdFromParams = parseInt(req.params.userId);

  // Find the user in the database
  const user = await User.findOne({ where: { Email } });

  if (!user) {
    return next(new appError(404, 'user not found'));
  }

  if (user.User_id !== userIdFromParams) {
    return next(new appError(409, 'Unauthorized access'));
  }

  // Find the image to delete
  const image = await Image.findOne({ where: { Image_id, UserId: user.User_id } });

  if (!image) {
    return next(new appError(404, 'Image not found'));
  }

  // Delete the image from the database
  await image.destroy();

  res.status(200).json({
    status: "success",
    message: 'Image deleted successfully'
  });

});



const GET_ALL = asyncErrorHandler(async (req, res, next) => {
  const email = req.user;
  const user = await User.findOne({ where: { Email: email } })

  if (user.User_id === 1) {
    const users = await User.findAll({
      include: {
        model: Image,
        attributes: ['Image_id', 'FileName'],
      },
    });

    if (users.length === 0) {
      throw new appError(404, "No users found");
    }

    const response = users.map((user) => ({
      email: user.Email,
      images: user.Images.map((image) => ({
        image_id: image.Image_id,
        filename: image.FileName,
        url: `http://localhost:4000/preview/${image.FileName}`,
      })),
    }));


    res.status(200).json({
      status: "success",
      data: {
        users: response,
      },
    });
  } else {
    return next(new appError(404, 'Not Access'))
  }

});



module.exports = { SIGNUP, LOGIN, GET_DATA, PDF_IMAGE, PREVIEW, UPLOAD, UPDATE, DELETE_IMAGE, GET_ALL }