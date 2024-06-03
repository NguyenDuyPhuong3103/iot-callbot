import { isAdmin } from "../middleware/authorization";
import express from "express";
const router = express.Router();

import AdminController from "../controllers/admin";
import {
  RequestWithUser,
  verifyUserAccessToken,
} from "../middleware/jwtServices";

router.use(verifyUserAccessToken, isAdmin);

/*  Đầu vào:  page, limit và các searchText nếu có
    Đầu ra: trả về các userId và name của các user
*/
router.get("/readUsers", AdminController.readUsers);

/* Xem thông tin chi tiết user */
/*  Đầu vào: id của user mà admin muốn xem
    Đầu ra: thông tin chi tiết của người dùng như dự án, dữ liệu dịch vụ và chi phí.
*/
router.get("/readProfile/:id", AdminController.readProfileById);

/* Thay đổi email user */
/*  Đầu vào:  userId cần sử ở params
              email mới ở req.body
    Đầu ra: gửi thông báo đã thay đổi thành công email đến email cũ và email mới
*/
router.patch("/editUserEmail/:id", AdminController.editUserEmail);

/* Khóa/mở khóa user */
/*  Đầu vào: id của user mà admin muốn khóa/mở khóa 
    Đầu ra: khóa/mở khóa user thành công
*/
router.patch("/unLockUser/:id", AdminController.unLockUser);
router.patch("/lockUser/:id", AdminController.lockUser);

/* Xem lịch sử */
/*  Đầu vào: id của user
    Đầu ra: thông tin chi tiết về lịch sử user.
router.get("/userHistory/:id", AdminController.userHistory);

/* Viết thêm */
router.post("/createUser", AdminController.createUser);

/* Tạo mới service */
/*  Đầu vào:  thông tin của service được gửi qua body
    Đầu ra: service mới đã được tạo
*/
router.post("/createServiceByAdmin", AdminController.createServiceByAdmin);

/* Xoá user */
/*  Đầu vào:  id của userAdmin ở accessToken
              id của user ở params
              password được gửi qua body
    Đầu ra: xoá user thành công
*/
router.delete("/deleteUser/:id", AdminController.deleteUser);

/* Xoá service */
/*  Đầu vào:  id của user ở accessToken
              id của service ở params
              password được gửi qua body
    Đầu ra: xoá service thành công
*/
router.delete("/deleteService/:id", AdminController.deleteService);

/* Xoá project */
/*  Đầu vào:  id của user ở accessToken
              id của project ở params
              password được gửi qua body
    Đầu ra: xoá project thành công
*/
router.delete("/deleteProject/:id", AdminController.deleteProject);

export default router;
