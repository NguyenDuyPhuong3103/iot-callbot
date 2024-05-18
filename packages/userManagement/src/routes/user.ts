import express from "express";
const router = express.Router();

import UserController from "../controllers/user";
import { isUser } from "./../middleware/authorization";
import {
  RequestWithUser,
  verifyUserAccessToken,
  verifyUserRefreshToken,
} from "../middleware/jwtServices";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

/* Phần updateProfile chưa làm avatar

*/

router.get("/refreshToken", UserController.refreshToken);

/*
  Đầu vào : email, name, password ở req.body
  Đầu ra: thông tin user.
 */
router.post("/register", UserController.register);

/*
  Đầu vào: confirmUserToken ở req.params
  Đầu ra: cập nhật user có isConfirmed là false thành true
*/
router.get(
  "/confirmRegisterUser/:confirmUserToken",
  UserController.confirmRegisterUser
);

/* Đầu vào : email và password ở req.body - Đầu ra: thông tin user và accessToken.
 */
router.post("/login", UserController.login);

/* QUÊN MẬT KHẨU với 3 API: forgotPassword, verifyForgotPassword, resetPassword:
  1./ Khi người dùng quên mật khẩu thì sẽ gửi yêu cầu đến API forgotPassword để reset lại mật khẩu.
  2./ Sau khi xác nhận có email trong data thì API forgotPassword sẽ tạo ra một token để reset lại mật khẩu 
  và gửi token qua mail đến người dùng.
  3./ Người dùng nhấn vào link trong mail để reset lại mật khẩu. Link này chứa token và gọi tới API verifyForgotPassword 
  và sẽ hết hạn sau 15 phút kể từ bây giờ.
  4./ API verifyForgotPassword sẽ kiểm tra token có hợp lệ không. Nếu hợp lệ thì sẽ trả về user.id của user.
  5./ User nhập password mới và gửi lên API resetPassword.
  5./ API resetPassword sẽ lấy :id từ params và lấy mật khẩu mới từ body. Sau đó thay đổi mật khẩu của người dùng.
*/
//Đầu vào: email ở res.query - Đầu ra: gửi mail đến email mà user gửi lên
router.get("/forgotPassword", UserController.forgotPassword);

//Đầu vào: resetToken ở res.params - Đầu ra: trả về user.id
router.get(
  "/verifyForgotPassword/:resetToken",
  UserController.verifyForgotPassword
);

//Đầu vào: id ở res.params và newPassword ở res.body - Đầu ra: trả về thông tin user đã cập nhật mật khẩu mới
router.put("/resetPassword/:id", UserController.resetPassword);

router.use(verifyUserAccessToken);
router.get("/logout", UserController.logout);

/* 
Đầu vào: 
  avatar ở upload.single("file")
  email, fullName ở req.body
  user_id ở accessToken
Đầu ra: Cập nhật thành công avatar, email, fullName của user.
*/
router.put(
  "/updateProfile",
  upload.single("file"),
  UserController.updateProfile
);

/*
Đầu vào:  - userId ở accessToken
          - currentPassword, newPassword, newPasswordConfirm ở req.body
Đầu ra: thay đổi mật khẩu thành công
*/
router.patch("/changePassword", UserController.changePassword);

export default router;
