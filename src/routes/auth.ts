import express, {Request, Response} from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import {check, validationResult} from "express-validator";
import bcrypt from "bcryptjs"
import { verify } from "crypto";
import verifyToken from "../middleware/auth";
const router = express.Router();

router.post("/login", [
    check("email","Email is required").isString(),
    check("password","Password with 6 or more characters is required").isLength({min: 6}),],

    async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({message: errors.array()});
    }
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email : email});
        if(!user){
            return res.status(400).json({message : "Invalid Credentials"});
        }
        //check whether given pswd match with existing pswd;
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message : "Invalid Credentials"});
        }
        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET_KEY as string,{expiresIn: "1d"});
        res.cookie("auth_token", token , {httpOnly: true, secure: process.env.NODE_ENV === "production",maxAge: 86400000,});
        res.status(200).json({userId: user._id})
    }  catch (error) {
        console.log(error);
        res.status(500).json({message : "Something went wrong"})
    }
});

//end point for validating token 
router.get("/validate-token", verifyToken , (req: Request, res: Response) => {
    res.status(200).send({userId: req.userId})
})

//logout endpoint
router.post("/logout", (req: Request, res: Response) => {
    res.cookie("auth_token", "",{
        expires: new Date(0),
    });
    res.send();
});

export default router;