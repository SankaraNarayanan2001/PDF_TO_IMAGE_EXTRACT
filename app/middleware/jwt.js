const jwt=require('jsonwebtoken');
const asyncErrorHandler=require('../utils/asyncErrorHandler');
const appError=require('../utils/appError');



module.exports = asyncErrorHandler(async (req, res, next) => {
    const token = req.header('token')
    // CHECK IF WE EVEN HAVE A TOKEN
    if (!token) {
        return next(new appError(404,"invalid Token"));
  
    }
    const user = jwt.verify(token, 'Login')
    req.user = user.Email;
    next();
});

// module.exports =asyncErrorHandler(async (req, res, next) => {
//     try {
//       const token = req.header('token');
  
//       // CHECK IF WE EVEN HAVE A TOKEN
//       if (!token) {
//         throw new Error('Invalid token');
//       }
  
//       const user = jwt.verify(token, 'Login');
//       req.user = user.Email;
//       next();
//     } catch (error) {
//       console.log('errooorrrrr')
//     }
//   });