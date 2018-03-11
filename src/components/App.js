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
    mapLoaded: false
  };

  componentDidMount() {
    MapStore.getLocation();
  }

  mapLoaded = () => {
    this.setState({
<<<<<<< HEAD
      steps: newSteps,
      selectedStep: step
    });
  };

  calculateNewStep = (steps, routes, id) => {
    const { start_location, end_location, end_address } = routes.legs[0];
    const { travel_mode } = steps[0];
    let duration = 0;
    let distance = 0;
    const lat_lngs = [];
    steps.forEach((step) => {
      duration += step.duration.value;
      distance += step.distance.value;
      step.lat_lngs.forEach(segment => {
        lat_lngs.push(new google.maps.LatLng(segment.lat(), segment.lng()));
      });
    });
    const lastStep = steps[steps.length - 1];
    let newDirection = {
      start_location,
      end_location,
      travel_mode,
      id,
      lat_lngs,
      duration: {
        text: moment.duration(duration, 'seconds').humanize(),
        value: duration
      },
      distance: {
        text: `${(distance / 1000).toFixed(2)} km`,
        value: distance
      },
      instructions: `${_.upperFirst(travel_mode)} to ${end_address}`
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
    GoogleDirectionStore.mode = 'TRANSIT';
  };

  replaceDirectionsFromPoint = (oldStep, firstHalfSteps, firstHalfRoutes, secondHalfSteps, secondHalfRoutes) => {
    const wayPointExists = !!this.state.waypoints[0];
    firstHalfSteps.forEach(step => (step.new = true));
    const calculatedfirstHalfSteps = this.calculateNewStep(firstHalfSteps, firstHalfRoutes, this.state.waypoints.length);
    const calculatedsecondHalfSteps = this.calculateNewStep(secondHalfSteps, secondHalfRoutes, this.state.waypoints.length + 1);
    calculatedfirstHalfSteps.travel_mode = this.state.selectedStep.travel_mode;
    const newStepsArray = [calculatedfirstHalfSteps, calculatedsecondHalfSteps];
    this.setState({
      steps: wayPointExists ? [this.state.steps[0], ...newStepsArray] : newStepsArray
    });
    GoogleDirectionStore.mode = 'TRANSIT';
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
      steps: steps,
      directions: directions
    });
  };

  switchFromPoint = (mode) => {
    if (this.state.waypoints.length >= 2) {
      console.log('only 2 switches can be made');
      return;
    }
    let firstHalf;
    let secondHalf;
    GoogleDirectionStore.getDirections(
      this.state.waypoints[0] || this.state.currentLocation,
      this.state.selectedPoint,
      this.state.selectedStep.travel_mode
    ).then((res) => {
      firstHalf = res;
      return GoogleDirectionStore.getDirections(
        this.state.selectedPoint,
        this.state.destination,
        mode
      )
    }).then((res) => {
      secondHalf = res;
      this.replaceDirectionsFromPoint(this.state.selectedStep, firstHalf.routes[0].legs[0].steps, firstHalf.routes[0], secondHalf.routes[0].legs[0].steps, secondHalf.routes[0]);
      if (mode === 'DRIVING') {
        this.setState({ cars: [] });
        this.findCarLocation(this.state.selectedPoint.lat(), this.state.selectedPoint.lng());
      }
      this.setState({
        waypoints: [...this.state.waypoints, this.state.selectedPoint]
      })
    });
=======
      mapLoaded: true
    })
>>>>>>> feature/map_refactor
  }

  render() {
    const { mapLoaded } = this.state;
    const { cars, selectModo, selectedCar, modoPopup, target } = ModoStore;
    const { currentLocation, selectedPoint } = MapStore;
    console.log('cars', cars)
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          {(() => {
            if (currentLocation && currentLocation.lat) {
              return (
                <div>
                  <FlexMap
                    loadingElement={<div style={{ height: `100%` }} />}
                    containerElement={<div style={{ height: `400px` }} />}
                    mapElement={<div style={{ height: `100%` }} />}
                    mapStore={MapStore}
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=AIzaSyAjf2ss-IiW0kVCh9tRKvF4QGmR_CXJwRA&libraries=geometry,drawing,places&v=3"}
                    directionsStore={DirectionsStore}
                    mapLoaded={this.mapLoaded}
                    modoStore={ModoStore}
                  />
                  {mapLoaded && DirectionsStore.steps &&
                    <SelectedStep
                      step={DirectionsStore.steps.find(step => step.selected)}
                      searchNewDirections={DirectionsStore.searchNewDirections}
                    />}
                  {mapLoaded && DirectionsStore.directions && DirectionsStore.directions.routes
                    ? <Directions
                      selectStep={DirectionsStore.selectStep}
                      steps={DirectionsStore.steps}
                      searchNewDirections={this.searchNewDirections}
                      showDetail={this.showDetail}
                      details={DirectionsStore.detailSteps}
                    />
                    : <Paper style={paperStyle}>
                      <span>Search for a destination to start</span>
                    </Paper>}

                  {modoPopup &&
                    <Popover
                      open={modoPopup}
                      anchorEl={target}
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
                      <ModoButton selectedCar={selectedCar} />
                    </Popover>}
                </div>
              );
            }
            return (
              <div>
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
              </div>
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
