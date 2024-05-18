import { isAdmin } from "../middleware/authorization";
import express from "express";
const router = express.Router();

import ServiceController from "../controllers/service";
import {
  RequestWithUser,
  verifyUserAccessToken,
} from "../middleware/jwtServices";

router.get("/", ServiceController.readServices);
router.use(verifyUserAccessToken);

/* Tạo mới service */
/*  Đầu vào:  thông tin của service được gửi qua body
    Đầu ra: service mới đã được tạo
*/
router.post(
  "/createServiceByUser/:projectId/:serviceId",
  ServiceController.createServiceByUser
);

/* Chỉnh sửa thông tin service */
/*  Đầu vào:  id của user ở accessToken
              id của service ở params
              tên mới của service
    Đầu ra: tên dự án đã được sửa
    */
router.patch(
  "/editServiceByUser/:projectId/:serviceId",
  ServiceController.editServiceByUser
);

router.use(isAdmin);

/* Kích hoạt service */
/*  Đầu vào:  id của user ở accessToken 
              id của service và project được gửi qua body
    Đầu ra: service đã được kích hoạt
*/
router.patch("/activateService", ServiceController.activateService);

/* Hủy kích hoạt service */
/*  Đầu vào:  id của user ở accessToken 
              id của service và project được gửi qua body
    Đầu ra: service đã được hủy kích hoạt
*/
router.patch("/deactivateService", ServiceController.deactivateService);

export default router;
