import express from "express"
import bcrypt from "bcrypt"
import User from "../models/User.js"
import jwt from "jsonwebtoken"
import authenticate from "../middleware/auth.js"
import Razorpay from "razorpay"
import crypto from "crypto"

const router = express.Router()

const secret = 'passwordsafehere'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
})

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

// Create Razorpay order for premium upgrade
router.post('/create-order', authenticate, async (req, res) => {
    try {
        const amount = 50000; // amount in paise (₹500)
        const currency = 'INR';
        const options = {
            amount,
            currency,
            receipt: `receipt_order_${req.user._id}_${Date.now()}`,
            payment_capture: 1
        };
        const order = await razorpay.orders.create(options);
        res.status(201).json({ order });
    } catch (err) {
        console.error('Razorpay order error:', err);
        res.status(500).send('Failed to create order');
    }
});

// Razorpay webhook to verify payment and update user to premium
router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expectedSignature) {
        return res.status(400).send('Invalid signature');
    }
    const event = req.body.event;
    if (event === 'payment.captured') {
        const email = req.body.payload.payment.entity.notes.email;
        if (!email) return res.status(400).send('Email not found in payment notes');
        const user = await User.findOneAndUpdate(
            { email },
            { $set: { premium: true } },
            { new: true }
        );
        if (!user) return res.status(404).send('User not found');
        return res.status(200).send('User upgraded to premium');
    }
    res.status(200).send('Webhook received');
});


export default router