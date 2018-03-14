/* global google */
import { observable, action } from 'mobx';
import _ from 'lodash';
import { toJS } from 'mobx';

import DirectionsStore from './DirectionsStore';

class MapStore {
  @observable refs = {};
  @observable searchBoxRef = null;
  @observable markers = [];
  @observable currentLocation = null;
  @observable center = null;
  @observable selectedPoint = null;
  @observable bounds = null; //new google.maps.LatLngBounds();

  getDummyLocation = () => {
    const testCoords = window.jonnysHouse;
    const position = {
      lat: testCoords.latitude,
      lng: testCoords.longitude
    };
    this.currentLocation = position;
    this.markers = [{ position }];
  };

  setDefaultLocation = () => {
    const position = {
      lat: 49.2847563,
      lng: -123.1143392
    };
    this.currentLocation = position;
    this.markers = [{ position }];
  };

  getLocation = test => {
    if (navigator && navigator.geolocation) {
      console.log('checking location');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { coords } = pos;
          const position = {
            lat: coords.latitude,
            lng: coords.longitude
          };
          this.currentLocation = position;
          this.markers = [{ position }];
        },
        err => {
          console.log(err);
          this.setDefaultLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      this.setDefaultLocation();
    }
  };

  onPlacesChanged = () => {
    const places = this.refs.searchBox.getPlaces();
    const bounds = new google.maps.LatLngBounds();
    if (places.length === 0) {
      return;
    }
    places.forEach(place => {
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    const nextMarkers = places.map(place => ({
      position: place.geometry.location
    }));
    const nextCenter = _.get(nextMarkers, '0.position', this.center);
    const destination = nextMarkers[0];
    this.center = nextCenter;
    this.markers = [this.markers[0], nextMarkers[0]];
    // MapsStore.refs.map.fitBounds(bounds);
    // Render Directions
    DirectionsStore.setDestination(destination.position);
    DirectionsStore.getDirections(
      this.currentLocation,
      toJS(destination.position)
    )
      .then(res => {
        DirectionsStore.setDirections(res);
        res.routes[0].legs[0].steps.forEach(step => {
          bounds.extend(step.start_location);
        });
        this.refs.map.fitBounds(bounds);
      })
      .catch(err => {
        console.err(`err fetching directions ${err}`);
        this.refs.map.fitBounds(bounds);
      });
  };

  @action.bound
  selectPoint = e => {
    this.selectedPoint = e.latLng;
  };

  onMapMounted = ref => {
    this.refs.map = ref;
  };

  onBoundsChanged = () => {
    this.refs.map.getBounds();
  };

  onSearchBoxMounted = ref => {
    this.refs.searchBox = ref;
  };
}

const store = new MapStore();
export default store;
