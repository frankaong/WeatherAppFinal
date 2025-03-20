import { Component } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@capacitor/geolocation';

const API_URL_ONECALL = environment.API_URL_ONECALL;  
const API_URL_WEATHER = environment.API_URL_WEATHER;
const API_KEY = environment.API_KEY;


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  cityName: string = '';
  weatherData: any;

  constructor(public httpClient:HttpClient) {}

  async loadWeatherByLatLong() {
  let permissionStatus = await Geolocation.checkPermissions();

  if (permissionStatus.location === 'prompt' || permissionStatus.location === 'denied') {
    permissionStatus = await Geolocation.requestPermissions();
  }

  if (permissionStatus.location !== 'granted') {
    console.error('Location permission denied.');
    return;
  }

  try {
    const coordinates = await Geolocation.getCurrentPosition();
    const { latitude, longitude } = coordinates.coords;

    this.httpClient.get(`${API_URL_ONECALL}?lat=${latitude}&lon=${longitude}&exclude=minutely&appid=${API_KEY}&units=metric`)
      .subscribe({
        next: (results) => {
          this.weatherData = results;
          console.log('Weather Data:', results);
        },
        error: (error) => {
          console.error('Error fetching weather:', error);
        }
      });
  } catch (error) {
    console.error('Error getting location:', error);
  }
}


  loadWeatherByCity () {
    this.httpClient.get(`${API_URL_WEATHER}?q=${this.cityName}&appid=${API_KEY}&units=metric`).subscribe({
      next: (results) => {
        this.weatherData = results;
        console.log('Weather Data (City):', this.weatherData);
      },
      error: (error) => {
        console.error('Error getting weather:', error);
      },
      complete: () => {
        console.log('Weather successfully loaded.');
      }
    });
  }
}