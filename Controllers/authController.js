import User from "../Models/userSchema.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Mail from "../Utils/mailer.js"


dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not configured");
}

// Register

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Allow only these roles
    const allowedRoles = ["user", "admin", "organizer"];
    const userRole = allowedRoles.includes(role) ? role : "user";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    await user.save();

    res.status(200).json({
      message: "Registered Successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message, error: "Server Error" });
  }
};


// Login

export const Login = async (req, res) => {
    try {

        const { email, password } = req.body

        const user = await User.findOne({ email, status: "active" })

        if (!user) {
            return res.status(401).json({ message: " Email Id is not Valid " })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: " Password is not valid " })
        }

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET,{ expiresIn: "24h" });
        // const decoded = jwtDecode(token);
        // console.log(decoded.exp);
        
        // user.token = token;
        // await user.save()

        res.status(200).json({ message: "Login successfully", token, role: user.role });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message, error: " Login Error " })

    }
};


// forgot password

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

            

        const user = await User.findOne({ email })        

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" })

        await Mail(user.email,
            "You are receiving this email because a request was made to reset the password for your account.",

            `Please click the link below to reset your password:

            http://localhost:5173/reset-password/${user._id}/${token} 

            If you did not request a password reset, please ignore this email. Your account will remain secure.

            For security reasons, this link will expire shortly.
            
            Thank you,
            The Support Team`
        );
        res.status(200).json({ message: "Email sent Successfully" })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}


//Reset Password

export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const { id, token } = req.params;

        const user = await User.findById(id);
        
        if (!user) {
        return res.status(200).json({message: "If this email exists, a reset link has been sent"});
        }
        //verify token

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "Token expired or invalid" });
        }

          if (decoded._id !== id) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

        //hash password

        const hashedPassword = await bcrypt.hash(password, 10);

        // update the password of user in db

        const updatedUser = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

        res.status(200).json({ message: "Password reset successfully", data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


