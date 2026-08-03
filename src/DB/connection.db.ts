import mongoose from "mongoose";
import { MONGO_URI } from "../config/config";
const DBConnection = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log("Database Connected👌🏽")
  } catch (error) {
    console.log(`fail to connect to db ${error}`)
  }

}

export default DBConnection;

