import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto"

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
    const {email, password, name} = req.body;
    try {
        if(!email || !password || !name){
            throw new Error("All fields are required")
        }

        const userAlreadyExists = await User.findOne({email});
        if (userAlreadyExists) {
            return res.status(400).json({message:"User already exists"})
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const verificationToken = Math.floor(10000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: "guest",
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 //24 Hours
        })

        await user.save();

        // ORIGINAL CODE
        // generateTokenAndSetCookie(res, user._id)
        // await sendVerificationEmail(user.email, verificationToken);
        // END OF ORIGINAL

        // BYPASS CODE
        generateTokenAndSetCookie(res, user._id);

        // Try sending verification email but don't fail signup if it errors
        try {
        await sendVerificationEmail(user.email, verificationToken);
        } catch (emailError) {
        // console.error("Error sending verification email:", emailError.message || emailError);
        // Optionally set a flag on user or in logs for manual follow-up
        }

return res.status(201).json({
  success: true,
  message: "User created successfully",
  user: { ...user._doc, password: undefined }
});

        
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password:undefined
            }
        })
    } catch (error) {
        // console.error("Signup error:", error);
    return res.status(400).json({ message: error.message });

    }
}

export const verifyEmail = async (req, res) => {
    const {code} = req.body;
    
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: {$gt: Date.now()}
        })

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            })
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        // ORIGINAL CODE
        // await sendWelcomeEmail(user.email, user.name)

        // res.status(200).json({
        //     success: true,
        //     message: "Email verified succesfully",
        //     user: {
        //         ...user._doc,
        //         password: undefined
        //     }
        // })

        // BYPASS CODE

        // after await user.save();
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.log("Error sending welcome email:", emailError?.message || emailError);
            // don't re-throw — allow verification to succeed
        }
        
        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: { ...user._doc, password: undefined },
        });

    } catch (error) {
        // console.error("Error verifying email:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid Credentials" });
      }
  
      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Invalid Credentials" });
      }
  
      // Generate token
      const token = generateTokenAndSetCookie(res, user._id); // make sure this function returns the token string
      user.lastLogin = new Date();
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Logged in successfully",
        token, // <-- include JWT here
        user: {
          ...user._doc,
          role: user.role,
          password: undefined,
        },
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: "Error logging in" });
    }
  };
  
export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logout succesfully"
    })
}

export const forgotPassword = async (req, res) => {
    const {email} = req.body;

    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            })
        }

        // Generate reset token

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; //1hour
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt

        await user.save();

        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`)
        
        res.status(200).json({
            success: true,
            message: "Password reset link sent"
        })
    } catch (error) {
        console.log("error in forgot password", error);
        res.status(400).json({ success: false, message: error.message});
        
    }
}

export const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: {$gt: Date.now() }
        })

        if(!user){
            return res.status(400).json({success: false, message: "Invalid or expired reset token"})
        }

        //update password
        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;

        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({
            success: true,
            message: "Password reset succesfull"
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({success: false, message: error.message})
    }
}

export const checkAuth = async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("-password");
      if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
      }
      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.log("Error in checkauth", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  