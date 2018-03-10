/* global google, firebase */
import React, { Component } from 'react';
import moment from 'moment';
import CircularProgress from 'material-ui/CircularProgress';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Popover from 'material-ui/Popover';
import Paper from 'material-ui/Paper';
import _ from 'lodash';

import { styles } from '../styles/Theme';
import ModoStore from '../stores/ModoStore';
import GoogleDirectionStore from '../stores/GoogleDirectionStore';
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

class App extends Component {
  state = {
    currentLocation: {},
    directions: {},
    cars: [],
    modoPopup: false,
    selectedCar: {},
    target: {},
    waypoints: []
  };
  setRefs = ref => {
    this.setState({
      refs: { map: ref }
    });
  };

  setDestination = destination => {
    this.setState({
      destination: destination
    });
  };

  selectPoint = e => {
    this.setState({
      selectedPoint: e.latLng
    });
  };

  componentDidMount() {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = pos.coords;
        const position = {
          lat: coords.latitude,
          lng: coords.longitude
        };
        this.setState({ currentLocation: position });
      });
    }
    // experimental firebase stuff
    // this.notifications = new NotificationResource(
    //   firebase.messaging(),
    //   firebase.database()
    // );
    //this.notifications.notify('hey');
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
    const lastStep = steps[steps.length - 1];
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
      lat_lngs: lat_lngs,
      id: oldStepId
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

  switchFromPoint = mode => {
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
    ).then(res => {
      firstHalf = res;
      return GoogleDirectionStore.getDirections(
        this.state.selectedPoint,
        this.state.destination,
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
            this.state.selectedPoint.lat(),
            this.state.selectedPoint.lng()
          );
        }
        this.setState({
          waypoints: [...this.state.waypoints, this.state.selectedPoint]
        });
      });
    });
  };

  searchNewDirections = (step, mode) => {
    // tryign to use point instead of step
    const bounds = new google.maps.LatLngBounds();
    if (!step) {
      GoogleDirectionStore.getDirections(
        this.state.currentLocation,
        this.state.destination,
        mode
      )
        .then(res => {
          this.setDirections(res);
          res.routes[0].legs[0].steps.forEach(step => {
            bounds.extend(step.start_location);
          });
          this.state.refs.map.fitBounds(bounds);
          if (mode === 'DRIVING') {
            this.setState({ cars: [] });
            if (this.state.currentLocation) {
              this.findCarLocation(
                this.state.currentLocation.lat,
                this.state.currentLocation.lng
              );
            }
          }
        })
        .catch(err => {
          console.err(`err fetching directions ${err}`);
          this.state.refs.map.fitBounds(bounds);
        });
      return;
    }

    const origin = step.start_location;
    const destination = step.end_location;
    GoogleDirectionStore.getDirections(origin, destination, mode).then(res => {
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
    const {
      currentLocation,
      directions,
      selectedPoint,
      cars,
      steps
    } = this.state;
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          {(() => {
            if (currentLocation && currentLocation.lat) {
              return (
                <div>
                  <NewMap
                    googleMapURL={window.api_key}
                    loadingElement={<div style={{ height: `100%` }} />}
                    containerElement={<div style={{ height: `400px` }} />}
                    mapElement={<div style={{ height: `100%` }} />}
                    currentLocation={currentLocation}
                    setRefs={this.setRefs}
                    selectedPoint={selectedPoint}
                    switchFromPoint={this.switchFromPoint}
                    setDirections={this.setDirections}
                    setDestination={this.setDestination}
                    cars={cars}
                    steps={steps}
                    selectStep={this.selectStep}
                    selectPoint={this.selectPoint}
                    selectModo={this.selectModo}
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
