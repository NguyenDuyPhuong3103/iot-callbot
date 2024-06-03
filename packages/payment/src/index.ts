import express, { Application } from "express";

const PORT = process.env.PORT || 5000;

const app: Application = express();

app.get("/", (req, res) => {
  res.send("Hello from payment service");
});

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
