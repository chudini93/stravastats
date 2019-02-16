const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// This is the client ID and client secret that you obtained
// while registering the application
const CLIENT_ID = "32572";
const CLIENT_SECRET = "5e338c16d1f1a398f046296384bf06812073d390";
const GRANT_TYPE_AUTHORIZATION = "authorization_code";
const GRANT_TYPE_REFRESH = "refresh_token";

const app = express();
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(function(req, res, next) {
  next();
});

app.get("/oauth/redirect", async (req, res) => {
  const requestToken = req.query.code;
  console.log("GET oauth/redirect, request token=", requestToken);

  var requestBody = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: GRANT_TYPE_AUTHORIZATION,
    code: requestToken
  };
  var response = await request(
    "POST",
    "https://www.strava.com/oauth/token",
    false,
    requestBody
  );

  console.log("response: ", response);
  const accessToken = response.access_token;
  const refreshToken = response.refresh_token;
  const expiresAt = response.expires_at;
  const athleteId = response.athlete.id;
  const state = response.state;
  // redirect the user to the welcome page, along with the access token

  res.redirect(
    `/welcome.html?access_token=${accessToken}&athlete=${athleteId}&refresh_token=${refreshToken}&expires_at=${expiresAt}`
  );
});

app.listen(5000, () => {
  console.log("App listening on port 5000!");
});

function request(method, url, bearer = true, data = null) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    if (bearer) {
      xhr.setRequestHeader(
        "Authorization",
        `${token.tokenType} ${token.accessToken}`
      );
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        return resolve(JSON.parse(xhr.responseText || "{}"));
      } else {
        console.log(`Request failed with status ${xhr.status}`);
        return reject(new Error(`Request failed with status ${xhr.status}`));
      }
    };
    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  });
}
