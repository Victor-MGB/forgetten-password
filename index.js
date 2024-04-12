// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const authRoutes = require("./routes/authRoutes");
require("dotenv").config()

// Initialize Express app
const app = express();

// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure express-session middleware
app.use(
  session({
    secret: process.env.JWT_SECRETE,
    resave: true,
    saveUninitialized: true,
  })
);

// Configure connect-flash middleware
app.use(flash());

// Connect to MongoDB database using Mongoose
mongoose
  .connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Define routes

app.use("/auth",authRoutes);
// For example:
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
