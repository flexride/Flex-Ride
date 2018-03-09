/* global google */
import React, { Component } from 'react';
import {
  GoogleMapLoader,
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Polyline,
  InfoWindow
} from 'react-google-maps';
import mapStyle from './mapStyle.json';

class NewMap extends Component {
  render() {
    console.log('render');
    return (
      <GoogleMap
        defaultZoom={15}
        defaultCenter={{ lat: -34.397, lng: 150.644 }}
        defaultOptions={{ styles: mapStyle }}
      />
    );
  }
}

export default withScriptjs(withGoogleMap(NewMap));
