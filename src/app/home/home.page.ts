import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { register } from 'swiper/element/bundle';
import { Network } from '@capacitor/network';
import { AlertController } from '@ionic/angular';
import { Platform } from '@ionic/angular';

const API_URL_ONECALL = environment.API_URL_ONECALL;  
const API_URL_WEATHER = environment.API_URL_WEATHER;
const API_KEY = environment.API_KEY;

register();

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  cityName: string = '';
  weatherData: any = null;
  onecallWeatherData: any = null;
  darkMode = false;
  tempUnit = false;
  offlineMode = false;
  isOnline = false;
  loading = true;
  
  constructor(public httpClient:HttpClient, private alertController: AlertController) {}
  // , private platform: Platform

  async ngOnInit() {
    await this.loadTheme();
    await this.loadTemperatureUnit();
    await this.loadPreferences(); 
    await this.logCurrentNetworkStatus();
  
    if (this.offlineMode) {
      this.loadCachedWeather();
    } else if (this.isOnline) {
      this.loadWeatherByLatLong();
    } else {
      this.loadCachedWeather();
    }
  }

  // async loadWeatherByLatLong(lat?: number, lon?: number) {
  //   this.loading = true;
  //   const unit = this.tempUnit ? 'imperial' : 'metric';

  //   if (this.platform.is('hybrid')) {
  //     // Capacitor Geolocation (for mobile platforms)
  //     let permissionStatus = await Geolocation.checkPermissions();
  //     console.log("Permission status:", permissionStatus);

  //     if (permissionStatus.location === 'prompt' || permissionStatus.location === 'denied') {
  //       permissionStatus = await Geolocation.requestPermissions();
  //       console.log("Updated permission status:", permissionStatus);
  //     }

  //     if (permissionStatus.location !== 'granted') {
  //       console.error('Location permission denied.');
  //       return;
  //     }

  //     try {
  //       if (!lat || !lon) {
  //         const coordinates = await Geolocation.getCurrentPosition();
  //         lat = coordinates.coords.latitude;
  //         lon = coordinates.coords.longitude;
  //       }

  //       this.fetchWeatherData(lat, lon, unit);

  //     } catch (error) {
  //       console.error('Error getting location on mobile:', error);
  //       this.loading = false;
  //       return;
  //     }
  //   } else {
  //     // Fallback for web platform using browser's geolocation API
  //     if (!lat || !lon) {
  //       if (navigator.geolocation) {
  //         navigator.geolocation.getCurrentPosition(
  //           (position) => {
  //             lat = position.coords.latitude;
  //             lon = position.coords.longitude;
  //             this.fetchWeatherData(lat, lon, unit);
  //           },
  //           (error) => {
  //             console.error('Error getting location on web:', error);
  //             this.loading = false;
  //           }
  //         );
  //       } else {
  //         console.error('Geolocation is not supported by this browser.');
  //         this.loading = false;
  //       }
  //       return;  // Exit early as the weather fetch will happen inside the callback
  //     } else {
  //       this.fetchWeatherData(lat, lon, unit);
  //     }
  //   }
  // }

  // private fetchWeatherData(lat: number, lon: number, unit: string) {
  //   this.httpClient.get(`${API_URL_ONECALL}?lat=${lat}&lon=${lon}&exclude=minutely&appid=${API_KEY}&units=${unit}`).subscribe({
  //     next: async (results) => {
  //       this.onecallWeatherData = results;
  //       console.log('One Call Weather Data:', results);

  //       await Preferences.set({
  //         key: 'cachedWeatherData',
  //         value: JSON.stringify(this.onecallWeatherData)
  //       });

  //       this.loading = false;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching One Call weather:', error);
  //       this.loading = false;
  //       this.loadCachedWeather();
  //     }
  //   });

  //   this.httpClient.get(`${API_URL_WEATHER}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`).subscribe({
  //     next: (results: any) => {
  //       console.log('Fetched Weather Data:', results);
  //       this.weatherData = results; 

  //       this.loading = false;
  //     },
  //     error: (error) => {
  //       console.error('Error getting weather:', error);
  //       this.loading = false;
  //       this.loadCachedWeather();
  //     }
  //   });
  // }
  async loadWeatherByLatLong(lat?: number, lon?: number) {
    this.loading = true;
    const unit = this.tempUnit ? 'imperial' : 'metric';
    
    let permissionStatus = await Geolocation.checkPermissions();
    console.log("Permission status:", permissionStatus);

    if (permissionStatus.location === 'prompt' || permissionStatus.location === 'denied') {
      permissionStatus = await Geolocation.requestPermissions();
      console.log("Updated permission status:", permissionStatus);
    }

    if (permissionStatus.location !== 'granted') {
      console.error('Location permission denied.');
      return;
    }

    try {
      if (!lat || !lon) {
        const coordinates = await Geolocation.getCurrentPosition();
        lat = coordinates.coords.latitude;
        lon = coordinates.coords.longitude;
      }

      this.httpClient.get(`${API_URL_ONECALL}?lat=${lat}&lon=${lon}&exclude=minutely&appid=${API_KEY}&units=${unit}`).subscribe({
            next: async (results) => {
              this.onecallWeatherData = results;
              console.log('One Call Weather Data:', results);
      
              await Preferences.set({
                key: 'cachedWeatherData',
                value: JSON.stringify(this.onecallWeatherData)
              });
      
              this.loading = false;
            },
            error: (error) => {
              console.error('Error fetching One Call weather:', error);
              this.loading = false;
              this.loadCachedWeather();
            }
          });

      this.httpClient.get(`${API_URL_WEATHER}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`).subscribe({
      next: (results: any) => {
        console.log('Fetched Weather Data:', results);
        this.weatherData = results; 

        this.loading = false;
      },
      error: (error) => {
        console.error('Error getting weather:', error);
        this.loading = false;
        this.loadCachedWeather();
      }
    });

    } catch (error) {
      console.error('Error getting location:', error);
      this.loading = false;
    }
  } 
  

  loadWeatherByCity() {
    this.loading = true;
    const unit = this.tempUnit ? 'imperial' : 'metric';

    this.httpClient.get(`${API_URL_WEATHER}?q=${this.cityName}&appid=${API_KEY}&units=${unit}`).subscribe({
      next: (results: any) => {
        console.log('Fetched Weather Data:', results);
        this.weatherData = results;
        console.log('Weather Data (City):', this.weatherData);
        const lat = results.coord.lat;
        const lon = results.coord.lon;
        
        
        this.loadWeatherByLatLong(lat, lon);
      },
      error: (error) => {
        console.error('Error getting weather:', error);
        this.loading = false;
      }
    });
  }

  async logCurrentNetworkStatus() {
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    console.log('Network status:', this.isOnline);
  }

  getHour(dt: number): string {
    const date = new Date(dt * 1000);
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  }
  

  getDate(dt: number): string {
    const date = new Date(dt * 1000);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  
  async changeTheme() {
    this.darkMode = !this.darkMode; 
  
    if (this.darkMode) {
      document.querySelector('ion-content')?.classList.add('dark');;
    } 
    else {
      document.querySelector('ion-content')?.classList.remove('dark');
    }
      

    await Preferences.set({
      key: 'themeStyle',
      value: this.darkMode ? 'enabled' : 'disabled',
    });
  }

  async loadTheme() {
    const storedTheme = await Preferences.get({ key: 'themeStyle' });
    this.darkMode = storedTheme.value === 'enabled';

    if (this.darkMode) {
      document.querySelector('ion-content')?.classList.add('dark');
    } 
    else {
      document.querySelector('ion-content')?.classList.remove('dark');
    }
    
  }

  async toggleTemperatureUnit() {
    this.tempUnit = !this.tempUnit; 
    this.loadWeatherByCity(); 
    this.loadWeatherByLatLong(); 

    await Preferences.set({
          key: 'temperatureUnit',
          value: this.tempUnit ? 'fahrenheit' : 'celsius',
    });
  }
  
  async loadTemperatureUnit() {
    const storedUnit = await Preferences.get({ key: 'temperatureUnit' });
    this.tempUnit = storedUnit.value === 'fahrenheit';
  }

  async toggleOfflineMode() {
    this.offlineMode = !this.offlineMode;
    console.log("Offline mode is now:", this.offlineMode);
  
    await Preferences.set({
      key: 'offlineMode',
      value: this.offlineMode ? 'true' : 'false',
    });
  
    if (this.offlineMode) {
      this.loadCachedWeather();
    } 
    else {
      this.loadWeatherByLatLong();
    }
  }
  
  async loadCachedWeather() {
    const storedData = await Preferences.get({ key: 'cachedWeatherData'});

    if (storedData.value) {
      this.onecallWeatherData = JSON.parse(storedData.value);
    }
    else {
      console.log("No cache available");
      this.showNoCacheAlert();
    }
  }

  async loadPreferences() {
    const offlinePref = await Preferences.get({ key: 'offlineMode' });
    this.offlineMode = offlinePref.value === 'true';
  }

  async showNoCacheAlert() {
    const alert = await this.alertController.create({
      header: 'No Cached Data',
      message: 'No saved weather data available.',
      buttons: ['OK']
    });

    await alert.present();
  }
  
}