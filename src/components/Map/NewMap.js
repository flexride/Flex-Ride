/* global google */
import React, { Component } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Polyline,
  InfoWindow
} from 'react-google-maps';
import { SearchBox } from 'react-google-maps/lib/components/places/SearchBox';
import GoogleDirectionStore from 'stores/GoogleDirectionStore';
import mapStyle from './mapStyle.json';

class NewMap extends Component {
  // state = {
  //   bounds: null,
  //   center: '',
  //   onMapMounted: '',
  //   onBoundsChanged: '',
  //   onSearchBoxMounted: '',
  //   onPlacesChanged: '',
  //   markers: ''
  // };

  componentWillMount() {
    const { currentLocation } = this.props;
    console.log('currentLocation', currentLocation);
    if (currentLocation && currentLocation.lat) {
      this.setState({ markers: [{ position: currentLocation }] });
    }
    this.setState({
      bounds: null,
      center: currentLocation,
      onMapMounted: this.onMapMounted,
      onBoundsChanged: this.onBoundsChanged,
      onSearchBoxMounted: this.onSearchBoxMounted,
      onPlacesChanged: this.onPlacesChanged
    });
  }

  onMapMounted = ref => {
    const { refs } = GoogleDirectionStore;
    ref.map = ref;
    this.props.setRef('mapRef', ref);
  };

  onBoundsChanged = () => {
    const { refs } = GoogleDirectionStore;
    this.setState({
      bounds: refs.map.getBounds()
    });
  };

  onSearchBoxMounted = ref => {
    const { refs } = GoogleDirectionStore;
    refs.searchBox = ref;
    this.props.setRef('SearchBoxRef', ref);
  };

  onPlacesChanged = () => {
    //move destnation to store
    let destination;
    const { currentLocation } = this.props;
    const { refs } = GoogleDirectionStore;
    const places = refs.searchBox.getPlaces();
    const bounds = new google.maps.LatLngBounds();
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
    const nextCenter = _.get(nextMarkers, '0.position', this.state.center);
    destination = nextMarkers[0];
    this.setState({
      center: nextCenter,
      markers: [this.state.markers[0], nextMarkers[0]]
    });
    // Render Directions
    this.props.setDestination(destination.position);
    GoogleDirectionStore.getDirections(currentLocation, destination.position)
      .then(res => {
        this.props.setDirections(res);
        res.routes[0].legs[0].steps.forEach(step => {
          bounds.extend(step.start_location);
        });
        refs.map.fitBounds(bounds);
      })
      .catch(err => {
        console.err(`err fetching directions ${err}`);
        refs.map.fitBounds(bounds);
      });
  };

  render() {
    const { currentLocation } = this.props;
    const { bounds, onPlacesChanged, onSearchBoxMounted } = this.props;
    const { markers, onBoundsChanged, onMapMounted } = this.state;
    console.log('onBoundsChanged: ', onMapMounted);
    console.log('state onBoundsChanged: ', this.state.onMapMounted);
    console.log(this.state.markers);
    return (
      <GoogleMap
        defaultZoom={15}
        center={currentLocation}
        onBoundsChanged={onBoundsChanged}
        ref={onMapMounted}
        defaultOptions={{ styles: mapStyle }}>
        <SearchBox
          bounds={bounds}
          controlPosition={google.maps.ControlPosition.TOP_LEFT}
          onPlacesChanged={onPlacesChanged}
          ref={onSearchBoxMounted}>
          <MapInput placeholder="Search for a destination" type="text" />
        </SearchBox>
        {markers.map((marker, index) =>
          <Marker key={index} position={marker.position} />
        )}
      </GoogleMap>
    );
  }
}

const MapInput = styled.input`
  box-sizing: border-box;
  border: 1px solid transparent;
  width: 240px;
  height: 32px;
  margin-top: 50px;
  margin-left: -105px;
  padding: 0 5px;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  outline: none;
  text-overflow: ellipses;
`;

export default withScriptjs(withGoogleMap(NewMap));
