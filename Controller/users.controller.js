import User from "../Models/users.model.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login error" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, type, location, description } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({
      name,
      email,
      password,
      role: type,
      location,
      description
    });

    await newUser.save();

    res.status(201).json({
      message: "Registration successful. You can now log in."
    });
  } catch (error) {
    res.status(500).json({ message: "Register error" });
  }
};