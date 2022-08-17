const latitudeEl = document.getElementById('latitude'),
  longitudeEl = document.getElementById('longitude'),
  weatherEl = document.getElementById('weather'),
  tempEl = document.getElementById('temp'),
  airqEl = document.getElementById('airq'),
  userTitleCont = document.getElementById('user-title'),
  userHistContainer = document.getElementById('history-container'),
  historyEl = document.getElementById('history'),
  geoDataContainer = document.getElementById('geo-data-container'),
  userNamecontainer = document.getElementById('user-name-container'),
  userNameInput = document.getElementById('username'),
  getTrakedBtn = document.getElementById('get-traked-btn'),
  takeMeASelfieBtn = document.getElementById('selfie-btn'),
  saveLocationBtn = document.getElementById('save-location-btn'),
  locationHistoryBtn = document.getElementById('location-history'),
  geoLocErrEl = document.getElementById('geo-not');

let historyContainerIsClean = true;

//! Print the map and Tiles

const myMap = L.map('map').setView([0, 0], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  minZoom: 3,
  attribution: '© OpenStreetMap',
}).addTo(myMap);

//! Making a map marker with a custom icon
const pointer = L.icon({
  iconUrl: 'location-pin-solid.svg',
  iconSize: [50, 32],
  iconAnchor: [25, 60],
});

const marker = L.marker([0, 0], { icon: pointer }).addTo(myMap);

//! Get coordinates from the client, request map, weather & air quality / Print all data on the DOM
function getGeoData() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      console.log('Geolocation available');

      let apiData,
        geoDataLat,
        geoDataLong,
        user,
        localWeatherCondition,
        localTemp;

      geoDataLat = position.coords.latitude;
      geoDataLong = position.coords.longitude;
      user = getUsername(userNameInput);

      //! make weather data request to the server
      try {
        const weatherAPI = `/weather/${+geoDataLat},${+geoDataLong}`;
        const apiResponse = await fetch(weatherAPI);
        apiData = await apiResponse.json();
        console.log('Data requested from the Server to the api:', apiData);

        localWeatherCondition = apiData.weather.currentConditions.conditions;
        localTemp = `${(
          ((+apiData.weather.currentConditions.temp - 32) * 5) /
          9
        ).toFixed(1)}°`;
        // const airqData = apiData.airq;
      } catch (error) {
        console.error('Weather api request error: ', error);
      }

      //! unhide DOM elements
      showHiddenEl(
        takeMeASelfieBtn,
        saveLocationBtn,
        locationHistoryBtn,
        geoDataContainer
      );

      //! Print data on the DOM
      printMarkerOnMap(geoDataLat, geoDataLong);
      printGeoData(geoDataLat, latitudeEl);
      printGeoData(geoDataLong, longitudeEl);
      printWeatherData(localWeatherCondition, weatherEl);
      printWeatherData(localTemp, tempEl);

      //! POST request to the server with Geo data
      const toDbData = {
        user,
        geoDataLat,
        geoDataLong,
        localWeatherCondition,
        localTemp,
      };
      console.log('<-----TEST----->', apiData);
      console.log('to database data: ', toDbData);
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toDbData),
      };
      const response = await fetch('/database', options);
      const dbData = await response.json();
      console.log('Database data:', dbData);
    });
  } else {
    console.log('Log err: ', 'Geolocation NOT available');
    // showHiddenEl(geoLocErrEl);
    // geoLocErrEl.innerText = 'Geolocation NOT available';
  }
}

//! Print geoData function
function printGeoData(data, domElement) {
  domElement.innerText = `${data.toFixed(2)}°`;
}

//! Print Marker location on map
function printMarkerOnMap(lat, long) {
  let firstTimeView = true;

  marker.setLatLng([lat, long]);
  if (firstTimeView) {
    myMap.setView([lat, long], 5);
    firstTimeView = false;
  }
}

//! Print weather function
function printWeatherData(data, domElement) {
  domElement.innerText = `${data}`;
}

//! Show Hidden Buttons Function

function showHiddenEl(...domEl) {
  domEl.map((el) => el.classList.remove('hide'));
}

//! Hide Elemment
function hideEl(...domEl) {
  domEl.map((el) => el.classList.add('hide'));
}

//! Toggle Elemment
function toggleEl(...domEl) {
  domEl.map((el) => el.classList.toggle('hide'));
}

//! Get Username and add it to DOM history container
function getUsername(input) {
  if (input.value) {
    return input.value;
  }
  return null;
}

//! Fetch History data to the database
async function getData() {
  const response = await fetch('/database');
  const data = await response.json();
  console.log('Database response: ', data);

  printUserName(data.user);
  printHistoryData(data);
}

//! Print Username on user-interface-container
function printUserName(username) {
  if (username) {
    const userTitleEl = userTitleCont.appendChild(
      document.createElement('div')
    );
    userTitleEl.classList.add('user-title');
    userTitleEl.innerHTML = `<p>Hi ${username}</p>`;
  }
}

//! Print history data on DOM user-interface-container
function printHistoryData(historyData) {
  if (historyContainerIsClean) {
    const ulEl = historyEl.appendChild(document.createElement('ul'));
    ulEl.classList.add('history-data-ul');

    for (let el of historyData) {
      const liEl = document.createElement('li');
      const date = new Date(el.timestamp);
      const formattedDate = date.toLocaleString();
      liEl.classList.add('track-list-el');
      const formattedLat = +el.geoDataLat.toFixed(2);
      const formattedLong = +el.geoDataLong.toFixed(2);
      liEl.innerHTML = `<div><p><b>Lat: </b><span class="geo-style-1">${formattedLat}°</span> - <b>Long: </b><span class="geo-style-1">${formattedLong}°</span> - </b><span class="geo-style-2">${formattedDate}</span></p></div> - <b>Temp: </b><span class="geo-style-1">${el.localTemp}</span>`;
      ulEl.appendChild(liEl);

      const marker = L.marker([el.geoDataLat, el.geoDataLong]).addTo(myMap);
      const pointerText = `Date: ${formattedDate} <br>
         Latitude: ${el.geoDataLat.toFixed(
           2
         )}° <br> Longitude: ${el.geoDataLong.toFixed(2)}° <br> 
         Weather: ${el.localWeatherCondition} <br>
         Temp: ${el.localTemp}`;
      marker.bindPopup(pointerText);
    }
    historyContainerIsClean = false;
  }
}

//! Print history pointers on the map

//! Event Listeners
getTrakedBtn.addEventListener('click', () => {
  getGeoData();
  hideEl(userHistContainer);
});

saveLocationBtn.addEventListener('click', () => {
  hideEl(userHistContainer, geoDataContainer);
  console.log('Geolocation data saved');
});

takeMeASelfieBtn.addEventListener('click', () => {
  hideEl(userHistContainer, geoDataContainer);
  console.log('Take me a Selfie');
});

locationHistoryBtn.addEventListener('click', () => {
  getData();
  toggleEl(userHistContainer);
  hideEl(geoDataContainer);
});
