const CLIENT_ID = "32572";
const CLIENT_SECRET = "5e338c16d1f1a398f046296384bf06812073d390";
const GRANT_TYPE_REFRESH = "refresh_token";

var token = {
  accessToken: "",
  refreshToken: "",
  tokenType: "Bearer",
  expiresAt: 0
};

var athleteId = "";
var isTestMode = true;

class App {
  async init() {
    try {
      let query = window.location.search.substring(1);
      await mapTokensFromUrl(window.location.href, token);

      if (!isTestMode) {
        await validateToken(token);
      }
      loadData(false);
      this.render();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }
  render() {}
}

let app = new App();
app.init();

async function loadData(showLoader = true, manualReload = false) {
  if (showLoader) {
    document.getElementById("reload").classList.add("hidden");
    document.getElementById("sync-loader").classList.remove("hidden");
  }

  if (!isTestMode || manualReload) {
    // loadAthleteStats(athleteId);
    // loadActivitiesForAuthenticatedAthlete();
  }

  if (manualReload) {
    await validateToken(token);
  }

  if (manualReload) {
    loadAuthenticatedAthlete();
  } else {
    loadAuthenticatedAthlete(isTestMode);
  }

  setTimeout(() => {
    document.getElementById("reload").classList.remove("hidden");
    document.getElementById("sync-loader").classList.add("hidden");
  }, 200);
}

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

async function mapTokensFromUrl(url, tkn) {
  tkn.accessToken = getParameterByName("access_token", url);
  tkn.refreshToken = getParameterByName("refresh_token", url);
  tkn.expiresAt = parseInt(getParameterByName("expires_at", url));
  athleteId = getParameterByName("athlete", url);
}

async function mapTokens(tkn) {
  token.accessToken = tkn.access_token;
  token.refreshToken = tkn.refresh_token;
  token.expiresAt = parseInt(tkn.expires_at);
  token.tokenType = tkn.token_type;
}

async function validateToken(tkn) {
  let currentTimestamp = convertDateToCurrentTimestamp(Date.now());
  if (currentTimestamp < tkn.expiresAt) {
    console.log("Token valid");
  } else {
    console.log("Token expired. Refreshing token started.");
    var requestBody = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: GRANT_TYPE_REFRESH,
      refresh_token: tkn.refreshToken
    };
    var response = await request(
      "POST",
      `https://www.strava.com/oauth/token`,
      false,
      requestBody
    );
    console.log("Token refreshed: ", response);
    if (response) {
      await mapTokens(response);

      if (currentTimestamp < response.expiresAt) {
        console.log("Token refreshed successfully.");
      } else {
        console.log("Token refresh failed!");
      }
    } else {
      console.log("Token refresh failed!");
    }
  }
}

async function loadAuthenticatedAthlete(testMode = false) {
  var athlete = null;
  var linkToProfilePicture =
    "https://caroda.io/wp-content/themes/thesaas/assets/img/placeholder-avatar.jpg";
  var fullName = "-";

  if (!testMode) {
    athlete = await request("GET", "https://www.strava.com/api/v3/athlete");
    linkToProfilePicture = athlete.profile;
    fullName = `${athlete.firstname} ${athlete.lastname}`;
  }

  if (athlete) {
    document.getElementById("isSynced").innerHTML = "ON";
    document.getElementById("isSynced").className = "green";
    document.getElementById("syncdate").innerHTML = convertDateToString();
  } else {
    document.getElementById("isSynced").innerHTML = "OFF";
    document.getElementById("isSynced").className = "red";
  }
  console.log("athlete: ", athlete);

  document.getElementById("avatar").setAttribute("src", linkToProfilePicture);
  document.getElementById("fullname").innerHTML = fullName;
}

async function loadAthleteStats(id) {
  var allTimeInfo = getAllTimeInfo(id);
  var currentYearInfo = getCurrentYearInfo();
  var previousYearInfo = getPreviousYearInfo();
  var last3MonthsInfo = get3MonthsInfo();
  var thisMonthInfo = getThisMonthSummaryInfo();
}

async function getAllTimeInfo(id) {
  var athleteStats = await request(
    "GET",
    `https://www.strava.com/api/v3/athletes/${id}/stats`
  );
  console.log("athleteStats: ", athleteStats);

  var allTimeInfo = {
    header: "All time",
    rides: athleteStats.all_ride_totals.count,
    distance: convertMetersToKilometers(
      athleteStats.all_ride_totals.distance,
      UNIT
    ),
    elapsedTime: convertSecondsToString(
      athleteStats.all_ride_totals.elapsed_time,
      1
    ),
    elevationGain: athleteStats.all_ride_totals.elevation_gain,
    movingTime: convertSecondsToString(
      athleteStats.all_ride_totals.moving_time,
      1
    ),
    biggestDistance: convertMetersToKilometers(
      athleteStats.biggest_ride_distance,
      UNIT
    )
  };
  console.log("allTime: ", allTimeInfo);

  return allTimeInfo;
}