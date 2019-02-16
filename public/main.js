const CLIENT_ID = "32572";
const CLIENT_SECRET = "5e338c16d1f1a398f046296384bf06812073d390";
const GRANT_TYPE_REFRESH = "refresh_token";
const UNIT = "km";
const SPEED_UNIT = "km/h";

var token = {
  accessToken: "",
  refreshToken: "",
  tokenType: "Bearer",
  expiresAt: 0
};

var athleteId = "";

class App {
  async init() {
    try {
      let query = window.location.search.substring(1);
      await mapTokensFromUrl(window.location.href, token);
      await validateToken(token);
      loadAuthenticatedAthlete();
      loadAthleteStats(athleteId);
      loadActivitiesForAuthenticatedAthlete();
      this.render();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }
  render() {}
}

let app = new App();
app.init();

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

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function loadAuthenticatedAthlete() {
  var athlete = await request("GET", "https://www.strava.com/api/v3/athlete");
  console.log("athlete: ", athlete);

  document.getElementById("avatar").setAttribute("src", athlete.profile);
  document.getElementById("fullname").innerHTML = `${athlete.firstname} ${
    athlete.lastname
  }`;
}

async function loadAthleteStats(id) {
  var athleteStats = await request(
    "GET",
    `https://www.strava.com/api/v3/athletes/${id}/stats`
  );
  console.log("athleteStats: ", athleteStats);

  var biggestDistance = convertMetersToKilometers(
    athleteStats.biggest_ride_distance,
    UNIT
  );
  console.log("biggestDistance: ", biggestDistance);

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
    )
  };
  console.log("allTime: ", allTimeInfo);

  var currentYear = new Date().getFullYear();
  var currentMonth = new Date().getMonth() + 1;
  var currentDay = new Date().getDay();

  var from = convertDateToCurrentTimestamp(new Date(currentYear, 1, 1));
  var until = convertDateToCurrentTimestamp(new Date(currentYear, 12, 31));
  var currentYearActivities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities?after=${from}&before=${until}`
  );
  var currentYearInfo = mapToSummaryInfo(currentYear, currentYearActivities);

  var from = convertDateToCurrentTimestamp(new Date(currentYear - 1, 1, 1));
  var until = convertDateToCurrentTimestamp(new Date(currentYear - 1, 12, 31));
  var previousYearActivities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities?after=${from}&before=${until}`
  );
  var previousYearInfo = mapToSummaryInfo(
    currentYear - 1,
    previousYearActivities
  );

  var from = convertDateToCurrentTimestamp(
    new Date(currentYear, currentMonth - 1, 1)
  );
  var lastDay = 30;
  if (currentMonth == 2) {
    lastDay = currentYear % 2 == 1 ? 28 : 29;
  } else {
    lastDay = currentMonth % 2 == 1 ? 31 : 30;
  }

  if (currentDay < lastDay) {
    lastDay = currentDay;
  }

  from = convertDateToCurrentTimestamp(
    new Date(currentYear, currentMonth - 1, 1)
  );
  var until = convertDateToCurrentTimestamp(new Date());
  var lastMonthActivities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities?after=${from}&before=${until}`
  );
  var lastMonthInfo = mapToSummaryInfo(
    "This month - " + getMonthName(currentMonth - 1),
    lastMonthActivities
  );
}

function getMonthName(monthIndex) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  var output = monthNames[monthIndex];
  return output;
}

async function mapToSummaryInfo(header, activities) {
  var distance = 0;
  var elapsedTime = 0;
  var rides = 0;
  var movingTime = 0;

  activities.forEach(element => {
    distance += element.distance;
    elapsedTime += element.elapsed_time;
    movingTime += element.moving_time;
    rides += 1;
  });

  var output = {
    header: header,
    rides: rides,
    distance: convertMetersToKilometers(distance, UNIT),
    elapsedTime: convertSecondsToString(elapsedTime, 1),
    movingTime: convertSecondsToString(movingTime, 1)
  };

  console.log(`"${header}: `, output);
  return output;
}

async function loadActivitiesForAuthenticatedAthlete() {
  var activities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities`
  );

  var activityRecords = [];

  activities.forEach(element => {
    var record = {
      id: element.id,
      name: element.name,
      date: convertDateToString(element.start_date_local),
      movingTime: convertSecondsToString(element.moving_time),
      elapsedTime: convertSecondsToString(element.elapsed_time),
      distance: convertMetersToKilometers(element.distance, UNIT),
      avgSpeed: convertMetersPerSecondToKilometerPerHour(
        element.average_speed,
        SPEED_UNIT
      ),
      elapsedAvgSpeed: calculateAverageSpeed(
        element.elapsed_time,
        element.distance,
        SPEED_UNIT
      ),
      maxSpeed: convertMetersPerSecondToKilometerPerHour(
        element.max_speed,
        SPEED_UNIT
      ),
      isCommute: element.commute,
      totalElevationGain: element.total_elevation_gain
    };

    activityRecords.push(record);
  });

  console.log("activities: ", activityRecords);
}

// 585 seconds = 9mins 45secs
// Formats: 0 => 9:45
//          1 => 0h 9m
function convertSecondsToString(epoc, format = 0) {
  var output = "";

  var hours = Math.floor(epoc / 3600);
  var minutes = Math.floor((epoc - hours * 3600) / 60);
  var seconds = epoc % 60;

  switch (format) {
    case 0:
      output = minutes + ":" + seconds;
      break;
    case 1:
      output = `${hours}h ${minutes}m`;
      break;
    default:
      break;
  }

  return output;
}

// 1 m/s = 3.6 km/h => 3.6
function convertMetersPerSecondToKilometerPerHour(
  meterPerSecond,
  speedUnit = null
) {
  var output = (meterPerSecond * 3.6).toFixed(2);
  if (speedUnit) output = output + " " + speedUnit;

  return output;
}

function calculateAverageSpeed(
  timeInSeconds,
  distanceInMeters,
  speedUnit = null
) {
  var time = timeInSeconds / 60;
  var distance = distanceInMeters / 1000;
  var output = ((60 / time) * distance).toFixed(2);

  if (speedUnit) output = output + " " + speedUnit;

  return output;
}

function convertMetersToKilometers(meters, unit = null) {
  var output = (meters / 1000).toFixed(2);
  if (unit) output = output + " " + unit;

  return output;
}

// DD/MM/YYYY 17:55
function convertDateToString(stringDate) {
  var date = new Date(stringDate);
  var output = date.toLocaleString(undefined, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return output;
}

function convertDateToCurrentTimestamp(date) {
  return Math.floor(date / 1000);
}
