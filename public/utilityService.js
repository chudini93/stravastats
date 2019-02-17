function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
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
  var output = 0;
  if (timeInSeconds > 0 && distanceInMeters > 0) {
    var time = timeInSeconds / 60;
    var distance = distanceInMeters / 1000;
    output = ((60 / time) * distance).toFixed(2);
  }

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
