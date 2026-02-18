import {model, models, Schema} from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: String,
  image: String,
  // Removed emailVerified field to disable email verification
  // emailVerified: Date,
});

export const User = models?.User || model('User', UserSchema);