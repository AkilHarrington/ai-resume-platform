import express from "express"

import { upload } from "../middleware/upload"
import { handleResumeUpload } from "../controllers/resume-upload-controller"

const router = express.Router()

router.post(
  "/upload",
  upload.single("resume"),
  handleResumeUpload
)

export default router