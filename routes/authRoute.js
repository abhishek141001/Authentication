import express from "express"
import bcrypt from "bcrypt"
import User from "../models/User.js"
import jwt from "jsonwebtoken"
import authenticate from "../middleware/auth.js"

const router = express.Router()

const secret = 'passwordsafehere'

router.post('/register', async(req,res)=>{

    console.log('req',req.body)
    const {name,email,password} = req.body
    
    if(!name && !email && !password){
       
        console.error('name, email and password are required field')
        return res.status(400).send('name, email and password are required field')
    }

    let user = await User.findOne({email:email})

    if(user){
        return res.status(400).send('email already exist')
    }

    const hasedPassword = await bcrypt.hash(password,10)
    console.log(name,email,hasedPassword)

    user = User.create({
        name:name,
        email:email,
        password:hasedPassword
    })
          
    res.status(201).send(`account created successfully with email ${email}`)
})


router.post('/login', async(req,res)=>{
  
    const {email, password} = req.body

    if(!email && !password){
        res.status(400).send('email and password are required')
    }

    const user = await User.findOne({email:email})
    
    if(!user){
        res.status(401).send('user doesnot exist')
    }

    const isCorrectPassword = await bcrypt.compare(password,user.password)

    console.log('password',isCorrectPassword)

    if(!isCorrectPassword){
        res.status(401).send('wrong email or password')
    }

    const token = jwt.sign(email,secret)

    res.status(201).send({message:'login successfull',token:token})

})


router.get('/user', authenticate ,async(req,res)=>{
 
    res.status(200).send({data:req.user})

})


export default router