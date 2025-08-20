import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },
    premium: {
        type: Boolean,
        default: false
    },

    // New fields for document management
    storageUsed: { type: Number, default: 0 }, // in bytes
    storageLimit: { type: Number, default: 1073741824 }, // 1GB default
    documentCount: { type: Number, default: 0 },
    preferences: {
        defaultSchema: { type: mongoose.Schema.Types.ObjectId, ref: 'Schema' },
        folderView: { type: String, enum: ['grid', 'list'], default: 'grid' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamps on save
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const User = mongoose.model('User',userSchema)
export default User