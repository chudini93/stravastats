var currentYear = new Date().getFullYear();
var currentMonth = new Date().getMonth();

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

async function getThisMonthSummaryInfo() {
  var from = convertDateToCurrentTimestamp(
    new Date(new Date().setMonth(new Date().getMonth())).setDate(1)
  );

  var until = convertDateToCurrentTimestamp(new Date());
  var thisMonthActivities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities?after=${from}&before=${until}`
  );
  var thisMonthInfo = mapToSummaryInfo(
    "This month - " + getMonthName(currentMonth - 1),
    thisMonthActivities
  );

  return thisMonthInfo;
}

async function mapToSummaryInfo(header, activities) {
  var distance = 0;
  var elapsedTime = 0;
  var rides = 0;
  var movingTime = 0;
  var maxSpeed = 0;

  activities.forEach(element => {
    distance += element.distance;
    elapsedTime += element.elapsed_time;
    movingTime += element.moving_time;
    rides += 1;
    if (element.max_speed > maxSpeed) {
      maxSpeed = element.max_speed;
    }
  });

  var output = {
    header: header,
    rides: rides,
    distance: convertMetersToKilometers(distance, UNIT),
    elapsedTime: convertSecondsToString(elapsedTime, 1),
    movingTime: convertSecondsToString(movingTime, 1),
    avgSpeed: calculateAverageSpeed(movingTime, distance, SPEED_UNIT),
    elapsedAvgSpeed: calculateAverageSpeed(elapsedTime, distance, SPEED_UNIT),
    maxSpeed: convertMetersPerSecondToKilometerPerHour(maxSpeed, SPEED_UNIT)
  };

  console.log(`"${header}: `, output);
  return output;
}

async function get3MonthsInfo() {
  var threeMonthsAgo = new Date(
    new Date().setMonth(new Date().getMonth() - 3)
  ).setDate(1);

  var monthAgo = new Date(new Date().setMonth(new Date().getMonth())).setDate(
    0
  );

  var from = convertDateToCurrentTimestamp(threeMonthsAgo);
  var until = convertDateToCurrentTimestamp(monthAgo);

  var last3MonthsActivities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities?after=${from}&before=${until}`
  );

  var last3MonthsInfo = mapToSummaryInfo(
    "Last 3 months: " +
      getMonthName(new Date(threeMonthsAgo).getMonth()) +
      " - " +
      getMonthName(new Date(monthAgo).getMonth()),
    last3MonthsActivities
  );

  return last3MonthsInfo;
}

async function getPreviousYearInfo() {
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

  return previousYearInfo;
}

async function getCurrentYearInfo() {
  var from = convertDateToCurrentTimestamp(new Date(currentYear, 1, 1));
  var until = convertDateToCurrentTimestamp(new Date(currentYear, 12, 31));
  var currentYearActivities = await request(
    "GET",
    `https://www.strava.com/api/v3/athlete/activities?after=${from}&before=${until}`
  );
  var currentYearInfo = mapToSummaryInfo(currentYear, currentYearActivities);
  return currentYearInfo;
}
