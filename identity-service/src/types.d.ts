import { Document } from "mongoose";

declare global {
    interface IUser extends Document {
      _id: mongoose.Schema.Types.ObjectId | string;    
      username: string;
      email: string;
      password: string;
      createdAt: Date;
      updatedAt: Date; 
      comparePassword(candidatePassword: string):  Promise<boolean>;
   }

   type RegisterUser = Pick<IUser, "username" | "email" | "password">;

   type LoginUser = Pick<IUser, "email" | "password">;
}

