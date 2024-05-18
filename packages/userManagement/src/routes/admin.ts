import { isAdmin } from "../middleware/authorization";
import express from "express";
const router = express.Router();

import AdminController from "../controllers/admin";
import {
  RequestWithUser,
  verifyUserAccessToken,
} from "../middleware/jwtServices";

router.use(verifyUserAccessToken, isAdmin);

/*  CHƯA XONG: 
      1./ Phần xem thông tin người dùng (3.1 - User Management) 
      2./ Phần theo dõi lịch sử hoạt động (3.4 - User Management): tương tự như phần 3.5-Project Management 
*/

/*  Đầu vào:  page, limit và các searchText nếu có
    Đầu ra: trả về các userId và name của các user
*/
router.get("/", AdminController.readUsers);

/* Xem thông tin chi tiết user */
/*  Đầu vào: id của user mà admin muốn xem
    Đầu ra: thông tin chi tiết của người dùng như dự án, dữ liệu dịch vụ và chi phí.
  Lưu ý: cần trả về:
    tên các project và các service trong projcet đó, thêm nữa trả về trạng thái hoạt động của từng service đó.
    tổng các dữ liệu của từng service đó 
    giá của từng service, tổng giá đã sử dụng của từng service và unpaid của từng service.
*/
router.get("/readProfile/:id", AdminController.readProfileById);

/* Thay đổi email user */
/*  Đầu vào:  userId cần sử ở params
              email mới ở req.body
    Đầu ra: gửi thông báo đã thay đổi thành công email đến email cũ và email mới
*/
router.patch("/:id", AdminController.editUserEmail);

/* Khóa/mở khóa user */
/*  Đầu vào: id của user mà admin muốn khóa/mở khóa 
    Đầu ra: khóa/mở khóa user thành công
*/
router.patch("/unLockUser/:id", AdminController.unLockUser);
router.patch("/lockUser/:id", AdminController.lockUser);

/* Xem lịch sử */
/*  Đầu vào: id của user
    Đầu ra: thông tin chi tiết về lịch sử user.
  Lưu ý: Cần trả về
    Từng service với ngày tạo, content và tên project của service đó
    Tổng của từng service
    */
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
