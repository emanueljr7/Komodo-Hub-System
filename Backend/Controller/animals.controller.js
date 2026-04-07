import Animal from "../Models/animals.model.js";

export const getAllAnimals = async (req, res) => {
  const animals = await Animal.find();
  
  // Here you would typically fetch all animals from your database
  res.status(200).json({ message: "Fetched all animals", animals });
}