class App {
  async init() {
    try {
      console.log("Redirect to auth.");
      var response = "";
      request(
        "GET",
        "https://www.strava.com/oauth/authorize?client_id=32572&redirect_uri=http://localhost:5000/&response_type=code&scope=activity:read_all"
      );
      this.render();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }
  render() {}
}

let app = new App();
app.init();

function request(method, url, data = null) {
  console.log("started");
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => {
      if (xhr.status === 200) {
        return resolve(JSON.parse(xhr.responseText || "{}"));
      } else {
        console.log("Request failed with status ${xhr.status}");
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
