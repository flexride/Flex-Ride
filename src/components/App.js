/* global google, firebase */
import React, { Component } from 'react';
import moment from 'moment';
import CircularProgress from 'material-ui/CircularProgress';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Popover from 'material-ui/Popover';
import Paper from 'material-ui/Paper';
import _ from 'lodash';
import { observer } from 'mobx-react';

import { styles } from '../styles/Theme';
import ModoStore from '../stores/ModoStore';
import DirectionsStore from '../stores/DirectionsStore';
import MapStore from '../stores/MapStore';
import FlexMap from './Map/FlexMap';
import NewMap from './Map/NewMap';
import Directions from './Directions/Directions';
import SelectedStep from './Directions/SelectedStep';
import ModoButton from './ModoButton';
import NotificationResource from '../resources/NotificationsResource';

const muiTheme = getMuiTheme({
  fontFamily: 'Proxima Nova Light, sans-serif',
  chip: styles.chip,
  floatingActionButton: styles.floatingActionButton,
  paper: styles.paper,
  card: styles.card
});

@observer
class App extends Component {
  state = {
    directions: {},
    cars: [],
    modoPopup: false,
    selectedCar: {},
    target: {},
    waypoints: [],
    center: {}
  };

  componentDidMount() {
    MapStore.getLocation();
  }

  selectStep = step => {
    const newSteps = this.state.steps.map(item => {
      item.selected = item.id === step.id ? true : false;
      return item;
    });

    this.setState({
      steps: newSteps,
      selectedStep: step
    });
  };

  onPlacesChanged = () => {
    const places = MapStore.refs.searchBox.getPlaces();
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
    const nextCenter = _.get(
      nextMarkers,
      '0.position',
      MapStore.center
    );
    const destination = nextMarkers[0];
    this.setState({
      center: nextCenter,
      markers: [MapStore.markers[0], nextMarkers[0]]
    });
    // MapsStore.refs.map.fitBounds(bounds);
    // Render Directions
    this.setDestination(destination.position);
    DirectionsStore.getDirections(
      MapStore.currentLocation,
      destination.position
    )
      .then(res => {
        this.setDirections(res);
        res.routes[0].legs[0].steps.forEach(step => {
          bounds.extend(step.start_location);
        });
        MapStore.refs.map.fitBounds(bounds);
      })
      .catch(err => {
        console.err(`err fetching directions ${err}`);
        MapStore.refs.map.fitBounds(bounds);
      });
  }

  calculateNewStep = (steps, routes, oldStepId) => {
    let duration = 0;
    let distance = 0;
    const lat_lngs = [];
    steps.forEach(step => {
      duration += step.duration.value;
      distance += step.distance.value;
      step.lat_lngs.forEach(segment => {
        lat_lngs.push(new google.maps.LatLng(segment.lat(), segment.lng()));
      });
    });
    const humanizeMode = _.upperFirst(steps[0].travel_mode);
    let newDirection = {
      start_location: routes.legs[0].start_location,
      end_location: routes.legs[0].end_location,
      id: lat_lngs,
      duration: {
        text: moment.duration(duration, 'seconds').humanize(),
        value: duration
      },
      distance: {
        text: `${(distance / 1000).toFixed(2)} km`,
        value: distance
      },
      travel_mode: steps[0].travel_mode,
      instructions: `${humanizeMode} to ${routes.legs[0].end_address}`,
      lat_lngs: lat_lngs
    };
    return newDirection;
  };

  replaceDirections = (oldStep, newSteps, newRoutes) => {
    oldStep.selected = false;
    newSteps.forEach(step => (step.new = true));
    const calculatedNewSteps = this.calculateNewStep(
      newSteps,
      newRoutes,
      oldStep.id
    );

    const newStepsArray = [...this.state.steps];
    newStepsArray.splice(
      this.state.steps.findIndex(step => step.id === oldStep.id),
      1,
      calculatedNewSteps
    );
    this.setState({
      steps: newStepsArray
    });
    DirectionsStore.mode = 'TRANSIT';
  };

  replaceDirectionsFromPoint = (
    oldStep,
    firstHalfSteps,
    firstHalfRoutes,
    secondHalfSteps,
    secondHalfRoutes
  ) => {
    const wayPointExists = !!this.state.waypoints[0];
    firstHalfSteps.forEach(step => (step.new = true));
    const calculatedfirstHalfSteps = this.calculateNewStep(
      firstHalfSteps,
      firstHalfRoutes,
      this.state.waypoints.length
    );
    const calculatedsecondHalfSteps = this.calculateNewStep(
      secondHalfSteps,
      secondHalfRoutes,
      this.state.waypoints.length + 1
    );
    calculatedfirstHalfSteps.travel_mode = this.state.selectedStep.travel_mode;
    const newStepsArray = [calculatedfirstHalfSteps, calculatedsecondHalfSteps];
    this.setState({
      steps: wayPointExists
        ? [this.state.steps[0], ...newStepsArray]
        : newStepsArray
    });
    DirectionsStore.mode = 'TRANSIT';
  };

  setDirections = directions => {
    var myRoute = directions.routes[0].legs[0];
    const steps = [];
    myRoute.steps.forEach(step => {
      step.id = step.encoded_lat_lngs;
      step.selected = false;
      steps.push(step);
    });
    this.setState({
      steps,
      directions
    });
  };

  switchFromPoint = mode => {
    if (this.state.waypoints.length >= 2) {
      console.log('only 2 switches can be made');
      return;
    }
    let firstHalf;
    let secondHalf;
    DirectionsStore.getDirections(
      this.state.waypoints[0] || MapStore.currentLocation,
      MapStore.selectedPoint,
      this.state.selectedStep.travel_mode
    ).then(res => {
      firstHalf = res;
      return DirectionsStore.getDirections(
        MapStore.selectedPoint,
        DirectionsStore.finalDestination,
        mode
      ).then(res => {
        secondHalf = res;
        console.log('firstHalf Steps:', firstHalf.routes[0].legs[0].steps);
        this.replaceDirectionsFromPoint(
          this.state.selectedStep,
          firstHalf.routes[0].legs[0].steps,
          firstHalf.routes[0],
          secondHalf.routes[0].legs[0].steps,
          secondHalf.routes[0]
        );
        if (mode === 'DRIVING') {
          this.setState({ cars: [] });
          this.findCarLocation(
            MapStore.selectedPoint.lat(),
            MapStore.selectedPoint.lng()
          );
        }
        this.setState({
          waypoints: [...this.state.waypoints, MapStore.selectedPoint]
        });
      });
    });
  };

  searchNewDirections = (step, mode) => {
    // tryign to use point instead of step
    const bounds = new google.maps.LatLngBounds();
    if (!step) {
      DirectionsStore.getDirections(
        MapStore.currentLocation,
        DirectionsStore.finalDestination,
        mode
      )
        .then(res => {
          this.setDirections(res);
          res.routes[0].legs[0].steps.forEach(step => {
            bounds.extend(step.start_location);
          });
          MapStore.refs.map.fitBounds(bounds);
          if (mode === 'DRIVING') {
            this.setState({ cars: [] });
            if (MapStore.currentLocation) {
              this.findCarLocation(
                MapStore.currentLocation.lat,
                MapStore.currentLocation.lng
              );
            }
          }
        })
        .catch(err => {
          console.err(`err fetching directions ${err}`);
          MapStore.refs.map.fitBounds(bounds);
        });
      return;
    }

    const origin = step.start_location;
    const destination = step.end_location;
    DirectionsStore.getDirections(origin, destination, mode).then(res => {
      this.replaceDirections(step, res.routes[0].legs[0].steps, res.routes[0]);
    });
    if (mode === 'DRIVING') {
      this.setState({ cars: [] });
      if (origin) {
        this.findCarLocation(origin.lat(), origin.lng());
      }
    }
  };

  findCarLocation = (lat, lng) => {
    ModoStore.getNearby(lat, lng).then(() => {
      ModoStore.findCarsFromLocation().then(() => {
        this.setState({ cars: ModoStore.blankArray });
      });
    });
  };

  selectModo = (e, car) => {
    this.setState({ modoPopup: true, selectedCar: car, target: e });
  };

  render() {
    const { directions } = this.state;
    const { currentLocation } = MapStore;
    console.log('rendering App')
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          {(() => {
            if (currentLocation && currentLocation.lat) {
              return (
                <div>
                  <FlexMap
                    currentLocation={MapStore.currentLocation}
                    setDirections={this.setDirections}
                    path={this.state.path}
                    steps={this.state.steps}
                    selectStep={this.selectStep}
                    cars={this.state.cars}
                    selectModo={this.selectModo}
                    setDestination={this.setDestination}
                    setRef={MapStore.setRef}
                    selectPoint={MapStore.selectPoint}
                    selectedPoint={MapStore.selectedPoint}
                    switchFromPoint={this.switchFromPoint}
                    onPlacesChanged={this.onPlacesChanged}
                    markers={MapStore.markers}
                  />
                  {this.state.steps &&
                    <SelectedStep
                      step={this.state.steps.find(step => step.selected)}
                      searchNewDirections={this.searchNewDirections}
                    />}
                  {directions && directions.routes
                    ? <Directions
                      selectStep={this.selectStep}
                      directions={this.state.directions}
                      steps={this.state.steps}
                      searchNewDirections={this.searchNewDirections}
                      showDetail={this.showDetail}
                      details={this.state.detailSteps}
                    />
                    : <Paper style={paperStyle}>
                      <span>Search for a destination to start</span>
                    </Paper>}

                  {this.state.modoPopup &&
                    <Popover
                      open={this.state.modoPopup}
                      anchorEl={this.state.target}
                      style={{ padding: '10px 8px 8px 8px' }}
                      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                      targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                      onRequestClose={() => {
                        this.setState({
                          modoPopup: false,
                          selectedCar: {},
                          target: {}
                        });
                      }}>
                      <ModoButton selectedCar={this.state.selectedCar} />
                    </Popover>}
                </div>
              );
            }
            return (
              <CircularProgress
                size={150}
                thickness={5}
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            );
          })()}
        </div>
      </MuiThemeProvider>
    );
  }
}

const paperStyle = {
  margin: '20px 15%',
  height: '100px',
  padding: '15px',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};
export default App;
