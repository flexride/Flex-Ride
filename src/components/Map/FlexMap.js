/* global google */
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { compose, withProps, lifecycle } from 'recompose';
import styled from 'styled-components';
import _ from 'lodash';
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  DirectionsRenderer
} from 'react-google-maps';
import { SearchBox } from 'react-google-maps/lib/components/places/SearchBox';
import DirectionsStore from 'stores/DirectionsStore';

import PointSwitchWindow from './PointSwitchWindow';
import Line from './Line';
import mapStyle from './mapStyle.json';


/* global google */
@observer
class FlexMap extends Component {
  componentWillMount() {
    this.props.mapLoaded();
  }
  render() {
    const {
      mapStore,
      directionsStore,
      modoStore
    } = this.props;
    const { cars, selectModo } = modoStore;
    const { markers, bounds, currentLocation, onMapMounted, onBoundsChanged, onSearchBoxMounted, onPlacesChanged, selectPoint, selectedPoint } = mapStore;
    const { steps, selectStep, switchFromPoint } = directionsStore;
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
          >
            <PointSwitchWindow switchFromPoint={switchFromPoint} />
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
            return (
              <Line key={i} step={step} selectStep={selectStep} selectPoint={selectPoint} />
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

export default withScriptjs(withGoogleMap(FlexMap));
