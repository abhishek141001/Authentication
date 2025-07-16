import express from "express"
import dotenv from "dotenv"
import authRoute from "./routes/authRoute.js"
import connectDb from "./config/db.js"


const app = express()

dotenv.config()


const port = process.env.PORT || 3000
app.use(express.json())
app.use(express.urlencoded({extended:true}))
// app.use(cors())

connectDb()
app.use('/api/auth',authRoute)


app.get('/',(req,res)=>{
    res.send('Hello World')
})



app.listen(port,()=>{
console.log('app is running on port:',port)

})
