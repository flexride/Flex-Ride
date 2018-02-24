/* global google */
import React from 'react';

import _ from 'lodash';
import { compose, withProps, lifecycle } from 'recompose';
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Polyline
} from 'react-google-maps';
import { SearchBox } from 'react-google-maps/lib/components/places/SearchBox';

let home;
const douglas = { lat: 49.2035681, lng: -122.9126894 };
let destination;

const MapWithASearch = compose(
  withProps({
    googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${window.api_key}&v=3.exp&libraries=geometry,drawing,places`,
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `300px` }} />,
    mapElement: <div style={{ height: `100%` }} />
  }),
  lifecycle({
    componentWillMount() {
      const refs = {};
      const { currentLocation } = this.props;
      if (currentLocation && currentLocation.lat) {
        this.setState({ markers: [{ position: currentLocation }] });
      }
      this.setState({
        bounds: null,
        center: currentLocation,
        onMapMounted: ref => {
          refs.map = ref;
        },
        onBoundsChanged: () => {
          this.setState({
            bounds: refs.map.getBounds()
          });
        },
        onSearchBoxMounted: ref => {
          refs.searchBox = ref;
        },
        onPlacesChanged: () => {
          console.log('onPlacesChanged');
          const places = refs.searchBox.getPlaces();
          const bounds = new google.maps.LatLngBounds();
          places.forEach(place => {
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          bounds.extend(currentLocation);
          const nextMarkers = places.map(place => ({
            position: place.geometry.location
          }));
          const nextCenter = _.get(
            nextMarkers,
            '0.position',
            this.state.center
          );
          destination = nextMarkers[0];

          this.setState({
            center: nextCenter,
            markers: [this.state.markers[0], nextMarkers[0]]
          });
          refs.map.fitBounds(bounds);
          // Render Directions
          const DirectionsService = new google.maps.DirectionsService();
          DirectionsService.route(
            {
              origin: currentLocation,
              destination: destination.position,
              travelMode: google.maps.TravelMode.TRANSIT
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                // this.setState({
                //   directions: result
                // });
                this.props.setDirections(result);
              } else {
                console.error(`error fetching directions ${result}`);
              }
            }
          );
        }
      });
    }
  }),
  withScriptjs,
  withGoogleMap
)(props =>
  <div>
    <GoogleMap
      center={props.currentLocation}
      defaultZoom={15}
      onBoundsChanged={props.onBoundsChanged}
      ref={props.onMapMounted}>
      <SearchBox
        bounds={props.bounds}
        controlPosition={google.maps.ControlPosition.TOP_LEFT}
        onPlacesChanged={props.onPlacesChanged}
        ref={props.onSearchBoxMounted}>
        <input
          placeholder="Customized your placeholder"
          style={{
            boxSizing: `border-box`,
            border: `1px solid transparent`,
            width: `240px`,
            height: `32px`,
            marginTop: `27px`,
            padding: `0 12px`,
            borderRadius: `3px`,
            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
            fontSize: `14px`,
            outline: `none`,
            textOverflow: `ellipses`
          }}
          type="text"
        />
      </SearchBox>
      {props.markers.map((marker, index) =>
        <Marker key={index} position={marker.position} />
      )}
      {props.directions && <DirectionsRenderer directions={props.directions} />}
      {props.steps &&
        props.steps.map(step => {
          return (
            <Polyline
              key={step.polyline.points}
              path={step.lat_lngs}
              options={{
                strokeColor: step.selected ? 'red' : 'blue',
                strokeWeight: 5
              }}
              onClick={() => {
                props.selectStep(step.id);
              }}
            />
          );
        })}
    </GoogleMap>
  </div>
);

export default MapWithASearch;
