    import mongoose from "mongoose";


    const userSchema = new mongoose.Schema(
        {
            name:{
                type:String,
                required:true
            },

            email:{
                type:String,
                required:true
            },
            password:{
                type:String,
                required:true,
            },
            token:{
                type:String
            },
            role:{
                type:String,
                enum:["user","organizer","admin"]
                
            },
            status: {
                type: String,
                enum: ["active", "suspended"],
                default: "active"   
            }
        },
        {
        timestamps: true
    }
    )

    export default mongoose.model("User", userSchema);
