import jwt from "jsonwebtoken"
import User from "../models/User.js"

const secret = process.env.JWT_SECRET || 'changeme-in-env'

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        if (!authHeader) {
            return res.status(401).send('Access denied: No authorization header')
        }

        const [schema, credential] = authHeader.split(' ')
        if (schema !== 'Bearer' || !credential) {
            return res.status(400).send('Bearer token missing or malformed')
        }
        const token = credential

        let payload
        try {
            payload = jwt.verify(token, secret)
        } catch (err) {
            return res.status(401).send('Invalid or expired token')
        }

        if (!payload || !payload.email) {
            return res.status(401).send('Access denied: Invalid token payload')
        }

        const user = await User.findOne({ email: payload.email }).select('-password')
        if (!user) {
            return res.status(401).send('Access denied: User not found')
        }

        req.user = user
        return next()
    } catch (err) {
        console.error('Auth error:', err)
        return res.status(500).send('Internal server error')
    }
}

export default authenticate