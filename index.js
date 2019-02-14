const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(function(req, res, next) {
  next();
});

// store in memory
let meals = ["dziala"];

app.get("/meals", (req, res) => {
  console.log("rest working");
  return res.send(meals);
});

// app.post('/meals', (req, res) => {
//   let meal = req.body
//   meal.id = Date.now()
//   meals.push(meal)
//   return res.send(meal)
// })

app.listen(5000, () => {
  console.log("App listening on port 5000!");
});
