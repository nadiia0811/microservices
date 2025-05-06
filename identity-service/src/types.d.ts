import { Document } from "mongoose";

declare global {
    interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date; 
    comparePassword(candidatePassword: string):  Promise<boolean>
   }

   type RegisterUser = Pick<IUser, "username" | "email" | "password">;
}

