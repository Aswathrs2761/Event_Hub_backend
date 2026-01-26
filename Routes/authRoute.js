import express from "express"
import { forgotPassword, Login, register, resetPassword } from "../Controllers/authController.js"




const router = express.Router()

router.post("/register", register)
router.post("/login", Login )
router.post("/forgotPassword", forgotPassword )
router.post("/resetPassword/:id/:token", resetPassword )








export default router;