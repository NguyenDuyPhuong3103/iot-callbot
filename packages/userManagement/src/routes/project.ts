import { isAdmin } from "../middleware/authorization";
import express from "express";
const router = express.Router();

import ProjectController from "../controllers/project";
import {
  RequestWithUser,
  verifyUserAccessToken,
  verifyProjectAccessToken,
} from "../middleware/jwtServices";

router.use(verifyUserAccessToken);

/* Xem tất cả project và tim kiếm project */
/*  Đầu vào:  id của user ở accessToken
              page?, limit?, searchText? của project ở query
    Đầu ra: thông tin (projectId và projectName) của tất cả các dự án của user đã tạo ra.
*/
router.get("/readProjects", ProjectController.readProjects);

/* Tạo mới projcet */
/*  Đầu vào:  id của user ở accessToken 
              tên của project được gửi qua body
    Đầu ra: dự án đã được tạo và accessToken của dự án đó
*/
router.post("/createProject", ProjectController.createProject);

/* Xem chi tiết project */
/*  Đầu vào:  id của user ở accessToken
              id của project được gửi qua params
              startDate? và endDate? được gửi qua body
    Đầu ra: thông tin chi tiết của dư án.
  Lưu ý: cần trả về
    Tên các service trong projcet đó và trạng thái hoạt động của từng service đó.
    Số lần đã sử dụng của từng service
    Giá của từng service, tổng tiền và unpaid
*/
router.get("/projectDetail/:id", ProjectController.projectDetail);

/* Chỉnh sửa thông tin project */
/*  Đầu vào:  id của user ở accessToken
              id của project ở params
              tên mới của project
    Đầu ra: tên dự án đã được sửa
*/
router.patch("/editProject/:id", ProjectController.editProject);

/* Làm mới refreshToken */
/*  Đầu vào:  id của user ở accessToken
              refreshProjectToken được gửi tự động qua cookie
              password được gửi qua body
    Đầu ra: accessToken mới và refreshToken mới
*/
router.get("/refreshProjectToken", ProjectController.refreshProjectToken);

/* Xem lịch sử tất cả project */
/*  Đầu vào:  id của user ở accessToken
              id, startDate? và endDate? của project được gửi qua params
    Đầu ra: thông tin chi tiết về lịch sử của dư án.
*/
router.get("/projectHistory/:id", ProjectController.projectHistory);

export default router;
