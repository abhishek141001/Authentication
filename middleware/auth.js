import jwt from "jsonwebtoken"
import User from "../models/User.js"
import logger from "../utils/logger.js"

const secret = process.env.JWT_SECRET || 'WXJC1UNzPg+dLmho8RWDWXxOvRZ7t5WE6dn7zZsGDJs='

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Access denied: No authorization header'
            })
        }

        const [schema, credential] = authHeader.split(' ')
        
        if (schema !== 'Bearer' || !credential) {
            return res.status(401).json({
                success: false,
                error: 'Bearer token missing or malformed'
            })
        }

        const token = credential

        let payload
        try {
            payload = jwt.verify(token, secret)
        } catch (err) {
            logger.error(`JWT verification failed: ${err.message}`)
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            })
        }

        if (!payload || (!payload.userId && !payload.id)) {
            return res.status(401).json({
                success: false,
                error: 'Access denied: Invalid token payload'
            })
        }

        // Use userId if available, otherwise fall back to id
        const userId = payload.userId || payload.id;
        
        // Validate that userId is a valid MongoDB ObjectId
        if (!userId || typeof userId !== 'string' || userId.length !== 24) {
            return res.status(401).json({
                success: false,
                error: 'Invalid user ID format'
            })
        }

        // Fetch user from database
        try {
            const user = await User.findById(userId).select('_id email name storageUsed storageLimit documentCount premium createdAt updatedAt');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                })
            }
            
            req.user = { 
                id: user._id.toString(), 
                email: user.email,
                name: user.name,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
                documentCount: user.documentCount,
                premium: user.premium
            }
            
            logger.info(`Authentication successful for user: ${req.user.id}`);
            return next()
        } catch (err) {
            logger.error(`User lookup failed: ${err.message}`)
            return res.status(401).json({
                success: false,
                error: 'User verification failed'
            })
        }
        
    } catch (err) {
        logger.error(`Auth middleware error: ${err.message}`)
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        })
    }
}

export default authenticate