import User from "../Models/users.model.js";

export const login = async (req, res) => {
  const { email, password } = req.body;
  

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const findUser = await User.findOne({ email });

  if (!findUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (findUser.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  res.status(200).json({ message: "Login successful", user: findUser });

  // Here you would typically check the email and password against your database
  
}

export const register = async (req, res) => {
  const { name, email, password, role} = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const newUser = new User({
    name,
    email,
    password,
    role
  });
  const savedUser = await newUser.save();
  if (savedUser) {
    res.status(201).json({ message: "User registered successfully", user: savedUser });
  } else {
    res.status(500).json({ message: "Error registering user" });
  } 
  // Here you would typically create a new user in your database

}