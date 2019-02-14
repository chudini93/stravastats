const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
// Import the axios library, to make HTTP requests
const axios = require("axios");

// This is the client ID and client secret that you obtained
// while registering the application
const clientID = "32572";
const clientSecret = "5e338c16d1f1a398f046296384bf06812073d390";
const grantTypeAuthorization = "authorization_code";
const grantTypeRefresh = "refresh_token";

const app = express();
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(function(req, res, next) {
  next();
});

// store in memory
var authenticated = false;

app.get("/oauth/redirect", (req, res) => {
  const requestToken = req.query.code;
  axios({
    method: "POST",
    url: `https://www.strava.com/oauth/token?client_id=${clientID}&client_secret=${clientSecret}&code=${requestToken}&grantType="${grantTypeAuthorization}"`,
    headers: {
      accept: "application/json"
    }
  }).then(response => {
    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    const expiredAt = response.data.expired_at;
    const athlete = response.data.athlete;
    const athleteId = athlete.id;
    const athleteName = `${athlete.firstname} ${athlete.lastname}`;
    console.log("------------------------------------------");
    console.log(response.data.athlete);
    console.log("------------------------------------------");
    const state = response.data.state;
    // redirect the user to the welcome page, along with the access token
    res.redirect(
      `/welcome.html?access_token=${accessToken}&athlete_id=${athleteId}&athlete=${athleteName}`
    );
  });
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
