const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const uuid = require("uuid")
const nodemailer = require("nodemailer");

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      confirmPassword,
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


router.post('/login',async(req,res)=>{
    try{
        const {usernameOrEmail,password} = req.body;

        const user = await User.findOne({
            $or:[
                {username:usernameOrEmail},
                {email:usernameOrEmail}
            ]
        })

        if(!user){
            return res.status(400).json({message:"Invalid username or email"})
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        req.session.user ={
        id:user._id,
        username:user.username,
        email: user.email
    }

    return res.status(200).json({message:"Login Successful", user:req.session.user})
    }catch(error){
        console.error("Error logging in user",error);
        return res.status(500).json({message:"Internal server error"})
    }
})

router.post("/forgot-password",async(req,res) =>{
    try{
        const {email} = req.body;

        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({message:"User not found with this email"})
        }

        const token = uuid.v4();

        user.resetToken = token;
        await user.save();

        const resetLink = `http://localhost:4000/auth/reset-password?token=${token}`;
        await sendResetEmail(email,resetLink);

        return res.status(200).json({message:"Password reset email sent successfully"});
    }catch(error){
        console.error("Error initiating password reset",error);
        return res.status(500).json({message:"Internal server error"})
    }
})

router.post("/reset-password",async(req,res) =>{
    try{
        const {token,newPassword} = req.body;

        const user = await User.findOne({resetToken:token});
        if(!user){
            return res.status(404).json({message:"Invalid or expired token"})
        }

        user.password = await bcrypt.hash(newPassword,10);
        user.resetToken = undefined;
        await user.save();

        return res.status(200).json({message:"password reset successfully"})
    }catch(error){
        console.error("error resetting password:",error);
        return res.status(500).json({message:"Internal server error"})
    }
});

async function sendResetEmail(email,resetLink){
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.USER,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.User,
      to: "aztop29@gmail.com",
      subject: "Password Reset",
      text: `Click the following link to reset your password: ${resetLink}`,
      html: `Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions)
}

router.get('/logout',(req,res) =>{
    req.session.destroy((err) =>{
        if(err){
            console.error("Error logging out user",err);
            return res.status(500).json({message:"Internal server Error"});
        }
        return res.status(200).json({message:"Logout successfully"});
    })
})

module.exports = router;
