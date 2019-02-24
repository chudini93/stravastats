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
  var reloadButton = document.getElementById("reload");
  var loader = document
    .getElementsByTagName("header")[0]
    .getElementsByTagName("loader")[0];

  if (showLoader) {
    DOM_setVisibility(reloadButton, false);
    DOM_setVisibility(loader, true);
  }

  if (manualReload) {
    await validateToken(token);
  }

  if (!isTestMode || manualReload) {
    loadAthleteStats(athleteId);
    // loadActivitiesForAuthenticatedAthlete();
  }

  if (manualReload) {
    loadAuthenticatedAthlete();
  } else {
    loadAuthenticatedAthlete(isTestMode);
  }

  setTimeout(() => {
    DOM_setVisibility(reloadButton, true);
    DOM_setVisibility(loader, false);
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
  var loader = document
    .getElementsByTagName("summary")[0]
    .getElementsByTagName("loader")[0];

  DOM_setVisibility(loader, true);

  var allTimeInfo = await getAllTimeInfo(id);
  DOM_updateSummaryItem(allTimeInfo, "allTime");

  var currentYearInfo = await getCurrentYearInfo();
  DOM_updateSummaryItem(currentYearInfo, "currentYear");
  // var previousYearInfo = getPreviousYearInfo();
  var last3MonthsInfo = await get3MonthsInfo();
  DOM_updateSummaryItem(last3MonthsInfo, "lastThreeMonths");

  var currentMonthInfo = await getCurrentMonthSummaryInfo();
  DOM_updateSummaryItem(currentMonthInfo, "currentMonth");

  DOM_updateDifference(currentMonthInfo, last3MonthsInfo);

  DOM_setVisibility(loader, false);
}

function DOM_setVisibility(dom, isVisible = true) {
  var visibility = isVisible ? "visible" : "collapse";
  dom.style.visibility = visibility;
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

function DOM_updateSummaryItem(data, id) {
  // header: header,
  // rides: rides,
  // distance: convertMetersToKilometers(distance, UNIT),
  // elapsedTime: convertSecondsToString(elapsedTime, 1),
  // movingTime: convertSecondsToString(movingTime, 1),
  // avgSpeed: calculateAverageSpeed(movingTime, distance, SPEED_UNIT),
  // avgSpeedValue: calculateAverageSpeed(movingTime, distance),
  // elapsedAvgSpeed: calculateAverageSpeed(elapsedTime, distance, SPEED_UNIT),
  // elapsedAvgSpeedValue: calculateAverageSpeed(elapsedTime, distance),
  // maxSpeed: convertMetersPerSecondToKilometerPerHour(maxSpeed, SPEED_UNIT),
  // maxSpeedValue: convertMetersPerSecondToKilometerPerHour(maxSpeed)header: header,
  // rides: rides,
  // distance: convertMetersToKilometers(distance, UNIT),
  // elapsedTime: convertSecondsToString(elapsedTime, 1),
  // movingTime: convertSecondsToString(movingTime, 1),
  // avgSpeed: calculateAverageSpeed(movingTime, distance, SPEED_UNIT),
  // avgSpeedValue: calculateAverageSpeed(movingTime, distance),
  // elapsedAvgSpeed: calculateAverageSpeed(elapsedTime, distance, SPEED_UNIT),
  // elapsedAvgSpeedValue: calculateAverageSpeed(elapsedTime, distance),
  // maxSpeed: convertMetersPerSecondToKilometerPerHour(maxSpeed, SPEED_UNIT),
  // maxSpeedValue: convertMetersPerSecondToKilometerPerHour(maxSpeed)

  var item = document.getElementById(id);
  var header = item.getElementsByClassName("title")[0];
  var values = item
    .getElementsByClassName("values")[0]
    .getElementsByTagName("span");

  var avgValueDOM = item.getElementsByClassName("avg-values");

  header.innerHTML = data.header;

  values[0].innerHTML = data.distance;
  values[1].innerHTML = data.movingTime;
  values[2].innerHTML = data.rides;

  if (avgValueDOM.length > 0) {
    var avgValues = avgValueDOM[0].getElementsByTagName("span");
    avgValues[0].innerHTML = data.avgSpeed;
    avgValues[1].innerHTML = data.maxSpeed;
    avgValues[2].innerHTML = data.elapsedAvgSpeed;
  }
}

function DOM_updateDifference(currMonth, last3MonthsInfo) {
  var differenceDOM = document
    .getElementById("currentMonth")
    .getElementsByClassName("difference")[0];

  DOM_removeAllChildNodes(differenceDOM);

  var diffAvgSpeed = currMonth.avgSpeedValue - last3MonthsInfo.avgSpeedValue;
  var diffMaxSpeed = currMonth.maxSpeedValue - last3MonthsInfo.maxSpeedValue;
  var diffElapsedAvgSpeed =
    currMonth.elapsedAvgSpeedValue - last3MonthsInfo.elapsedAvgSpeedValue;

  DOM_createDifferenceSpan(diffAvgSpeed, differenceDOM);
  DOM_createDifferenceSpan(diffMaxSpeed, differenceDOM);
  DOM_createDifferenceSpan(diffElapsedAvgSpeed, differenceDOM);
}

function DOM_createDifferenceSpan(value, parent) {
  var difference = document.createElement("span");
  difference.className = (value > 0 ? "green" : "red") + " small";

  var sign = "";
  if (value > 0) {
    sign = "+";
  }

  difference.innerHTML = sign + value + " " + SPEED_UNIT;
  parent.appendChild(difference);

  return difference;
}

function DOM_removeAllChildNodes(parent) {
  while (parent.hasChildNodes()) {
    parent.removeChild(parent.lastChild);
  }
}
