require("dotenv").config();

const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const createAdmin = async () => {
  try {
    await connectDB();

    const exists = await Admin.findOne({
      email: "admin@campus.com",
    });

    if (exists) {
      console.log("Admin already exists.");
      process.exit();
    }

    const admin = await Admin.create({
      name: "Campus Admin",
      email: "admin@campus.com",
      password: "Admin@123",
      mobile: "9876543210",
      shopName: "Campus Stationery",
    });

    console.log("==================================");
    console.log("Admin Created Successfully");
    console.log("==================================");
    console.log("Email    : admin@campus.com");
    console.log("Password : Admin@123");
    console.log("==================================");

    process.exit();

  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

createAdmin();