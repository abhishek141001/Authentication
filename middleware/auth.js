import jwt from "jsonwebtoken"
import User from "../models/User.js"

const secret = 'passwordsafehere'


const authenticate = async(req,res,next)=>{

    const authHeader = req.headers['authorization']

    if(!authHeader){
        res.status(401).send('access denied')
    }

    const [schema,credential] = authHeader.split(' ')

    if(schema !== 'Bearer'){
        res.status(400).send('Bearer token missing')
    }
    const token = credential

    const email = jwt.verify(token,secret)
 
    if(!email){
        res.status(401).send('access denied')
    }

 

  

    const user = await User.findOne({email:email}).select('-password')
    
    console.log('user',user)
    
    req.user = user
   
    return next()

}

export default authenticate