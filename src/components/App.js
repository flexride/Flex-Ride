/* global google */
import React, { Component } from 'react';

import ModoStore from '../Stores/ModoStore';
import GoogleDirectionStore from '../Stores/GoogleDirectionStore';
import MapWithSearchAndDirections from './Map/MapWithSearchAndDirections';
import Directions from './Directions/Directions';
import SelectedStep from './Directions/SelectedStep';

class App extends Component {
  state = {
    currentLocation: {},
    directions: {},
    lat: 49.201,
    lng: -122.91,
    cars: {},
    nearby: {},
    available: {}
  };

  selectStep = stepId => {
    const newSteps = this.state.steps.map(step => {
      step.selected = step.id === stepId ? true : false;
      return step;
    });
    this.setState({
      steps: newSteps
    });
  };

  setDirections = directions => {
    console.log('Settign directions in app');
    let stepId = 1;
    var points = [];
    var myRoute = directions.routes[0].legs[0];
    const steps = [];
    myRoute.steps.forEach(step => {
      step.id = stepId;
      step.selected = false;
      steps.push(step);
      stepId = stepId + 1;
    });
    console.log('setting State with steps');
    this.setState({
      steps: steps,
      directions: directions
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
    this.handleLoadNearby();
    // this.handleLoadCars();
    // this.handleLoadAvailability();
  }

  handleLoadNearby(lat = null, lng = null) {
    ModoStore.getNearby(this.state.lat, this.state.lng).then(() => {
      if (ModoStore.isLoading === false) {
        this.setState({ nearby: ModoStore.nearby });
      }
    });
  }

  handleLoadCars() {
    ModoStore.getCars().then(() => {
      if (ModoStore.isLoading === false) {
        this.setState({ nearby: ModoStore.cars });
        //console.log(this.state.cars);
      }
    });
  }

  handleLoadAvailability() {
    ModoStore.getAvailability().then(() => {
      if (ModoStore.isLoading === false) {
        this.setState({ available: ModoStore.availability });
        //console.log(this.state.availability);
      }
    });
  }

  searchNewDirections = (step) => {
    console.log('searchingfornewdirections');
    console.log(step);
    // GoogleDirectionStore.
  }

  render() {
    const { currentLocation, directions } = this.state;
    return (
      <div className="App">
        <div> Hey </div>
        {(() => {
          if (currentLocation && currentLocation.lat) {
            return (
              <div>
                <MapWithSearchAndDirections
                  currentLocation={this.state.currentLocation}
                  setDirections={this.setDirections}
                  path={this.state.path}
                  steps={this.state.steps}
                  selectStep={this.selectStep}
                />
                {directions &&
                  directions.routes &&
                  <Directions directions={this.state.directions} />}
                {this.state.steps && <SelectedStep
                  step={this.state.steps.find(step => step.selected)}
                  searchNewDirections={this.searchNewDirections}
                />}
              </div>
            );
          }
          return <div>Loading...</div>;
        })()}
      </div>
    );
  }
}

export default App;
