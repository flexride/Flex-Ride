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
  componentWillMount() {
    const { currentLocation } = this.props;
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
    const { setRefs } = this.props;
    refs.map = ref;
    setRefs(ref);
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
  };

  onPlacesChanged = () => {
    //move destnation to store
    let destination;
    const { currentLocation, setDirections, setDestination } = this.props;
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
    setDestination(destination.position);
    GoogleDirectionStore.getDirections(currentLocation, destination.position)
      .then(res => {
        setDirections(res);
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
    const {
      currentLocation,
      selectedPoint,
      switchFromPoint,
      cars,
      steps,
      selectStep,
      selectPoint,
      selectModo
    } = this.props;
    const {
      bounds,
      onPlacesChanged,
      onSearchBoxMounted,
      markers,
      onBoundsChanged,
      onMapMounted
    } = this.state;
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
        {selectedPoint &&
          <Marker
            position={selectedPoint}
            icon={{
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 5
            }}
            onClick={e => {
              console.log('point clicked');
            }}>
            <InfoWindow>
              <div>
                <div
                  onClick={() => {
                    switchFromPoint('WALKING');
                  }}>
                  {' '}Walk{' '}
                </div>
                <div
                  onClick={() => {
                    switchFromPoint('DRIVING');
                  }}>
                  {' '}Drive{' '}
                </div>
                <div
                  onClick={() => {
                    switchFromPoint('TRANSIT');
                  }}>
                  {' '}Transit{' '}
                </div>
                <div
                  onClick={() => {
                    switchFromPoint('BICYCLING');
                  }}>
                  {' '}Bike{' '}
                </div>
              </div>
            </InfoWindow>
          </Marker>}
        {cars.map((car, index) => {
          return (
            <Marker
              key={index}
              position={{ lat: Number(car.lat), lng: Number(car.lng) }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10
              }}
              onClick={e => {
                selectModo(e.xa.target, car);
              }}
            />
          );
        })}
        {steps &&
          steps.map((step, i) => {
            let color = 'blue';
            switch (step.travel_mode) {
              case 'WALKING':
                color = 'gray';
                break;
              case 'WALKING':
                color = 'yellow';
                break;
              case 'DRIVING':
                color = 'black';
                break;
              case 'BICYCLING':
                color = 'orange';
                break;
              default:
                break;
            }
            if (step.selected) {
              color = 'green';
            }
            return (
              <Polyline
                key={i}
                path={step.lat_lngs}
                options={{
                  strokeColor: color,
                  strokeWeight: 5
                }}
                onClick={e => {
                  if (!step.new) {
                    selectStep(step);
                  }
                  selectPoint(e);
                }}
              />
            );
          })}
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
