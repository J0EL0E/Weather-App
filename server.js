import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));


//home directory
app.get('/', (req, res) => {
    res.sendFile( path.join(__dirname, '/views/index.html') );
});

//getting the coordinates of the place searched by the user 
app.post('/search',  async (req, res) => {
 try {
    const searchKey = req.body["search-value"];
    const response = await axios('https://api.geocodify.com/v2/geocode', {
        params: {
        api_key: '6EqrxY82vtin6WIiQdL7flQR05MDB1cT',
        q: searchKey
        }
    });
    const responseData = response.data.response.features; 
    try {
        const mappedData = responseData.map((feature) =>  feature.geometry.coordinates);
        const locationData = responseData.map((location) => location.properties.name + ", " + location.properties.region + ", " + location.properties.country_a );
        const getWeather = await axios.get(`https://api.open-meteo.com/v1/ecmwf?latitude=${mappedData[0][1]}&longitude=${mappedData[0][0]}&daily=weather_code,apparent_temperature_max,apparent_temperature_min&hourly=weather_code,temperature_2m`
        );
        const hourlyWeatherTemp = getWeather.data.hourly.temperature_2m;
        const hourlyWeatherCode = getWeather.data.hourly.weather_code;
        const hourlyWeatherTime = getWeather.data.hourly.time;
        const maxWeatherTemperature = getWeather.data.daily.apparent_temperature_max;
        const minWeatherTemperature = getWeather.data.daily.apparent_temperature_min;
        const time = getWeather.data.daily.time;
        const weatherCode = getWeather.data.daily.weather_code;
        const weatherData = { 
            time: time,
            weather: weatherCode,
            maxTemp: maxWeatherTemperature,
            minTemp: minWeatherTemperature, 
            location: locationData,
            hourlyTime: hourlyWeatherTime,
            hourlyWeather: hourlyWeatherCode,
            hourlyTemp: hourlyWeatherTemp
        } 
        res.render('weather.ejs', weatherData);
    }
    catch (error) {
        res.send("Place not found")
    }
    }
    catch (error) {
        console.log(error);
    }
});

app.get('/weather', (req, res) => {
    res.render('weather.ejs')
});


app.listen(port, () => {
    `Listening from port ${port}`
});