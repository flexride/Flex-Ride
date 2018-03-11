/* global google */

import { observable } from 'mobx';
import _ from 'lodash';
import moment from 'moment';

import MapStore from './MapStore';
import ModoStore from './ModoStore';


class DirectionsStore {
  @observable DirectionsService = new google.maps.DirectionsService();
  @observable showDetail = false;
  @observable mode = 'TRANSIT';
  @observable directions = {}
  @observable finalDestination = {}
  @observable steps = null;
  @observable selectedStep = []
  @observable waypoints = []

  replaceDirectionsFromPoint = (
    oldStep,
    firstHalfSteps,
    firstHalfRoutes,
    secondHalfSteps,
    secondHalfRoutes
  ) => {
    const wayPointExists = !!this.waypoints[0];
    firstHalfSteps.forEach(step => (step.new = true));
    const calculatedfirstHalfSteps = this.calculateNewStep(
      firstHalfSteps,
      firstHalfRoutes,
      this.waypoints.length
    );
    const calculatedsecondHalfSteps = this.calculateNewStep(
      secondHalfSteps,
      secondHalfRoutes,
      this.waypoints.length + 1
    );
    calculatedfirstHalfSteps.travel_mode = this.selectedStep.travel_mode;
    const newStepsArray = [calculatedfirstHalfSteps, calculatedsecondHalfSteps];
    this.steps = wayPointExists ? [this.steps[0], ...newStepsArray] : newStepsArray;
  };

  switchFromPoint = mode => {
    if (this.waypoints.length >= 2) {
      console.log('only 2 switches can be made');
      return;
    }
    let firstHalf;
    let secondHalf;
    this.getDirections(
      this.waypoints[0] || MapStore.currentLocation,
      MapStore.selectedPoint,
      this.selectedStep.travel_mode
    ).then(res => {
      firstHalf = res;
      return this.getDirections(
        MapStore.selectedPoint,
        this.finalDestination,
        mode
      ).then(res => {
        secondHalf = res;
        console.log('firstHalf Steps:', firstHalf.routes[0].legs[0].steps);
        this.replaceDirectionsFromPoint(
          this.selectedStep,
          firstHalf.routes[0].legs[0].steps,
          firstHalf.routes[0],
          secondHalf.routes[0].legs[0].steps,
          secondHalf.routes[0]
        );
        if (mode === 'DRIVING') {
          ModoStore.findCarLocation(
            MapStore.selectedPoint.lat(),
            MapStore.selectedPoint.lng()
          );
        }
        this.waypoints = [...this.waypoints, MapStore.selectedPoint];
      });
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

    const newStepsArray = [...this.steps];
    newStepsArray.splice(
      this.steps.findIndex(step => step.id === oldStep.id),
      1,
      calculatedNewSteps
    );
    this.steps = newStepsArray;
  };

  searchNewDirections = (step, mode) => {
    const byCar = mode === 'DRIVING';
    // tryign to use point instead of step
    const bounds = new google.maps.LatLngBounds();
    if (!step) {
      this.getDirections(
        MapStore.currentLocation,
        this.finalDestination,
        mode
      )
        .then(res => {
          this.setDirections(res);
          res.routes[0].legs[0].steps.forEach(step => {
            bounds.extend(step.start_location);
          });
          MapStore.refs.map.fitBounds(bounds);
          if (byCar) {
            if (MapStore.currentLocation) {
              ModoStore.findCarLocation(
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
    this.getDirections(origin, destination, mode).then(res => {
      this.replaceDirections(step, res.routes[0].legs[0].steps, res.routes[0]);
    });
    if (byCar && origin) {
      ModoStore.findCarLocation(origin.lat(), origin.lng());
    }
  };

  setDestination = destination => {
    this.finalDestination = destination;
  };

  setDirections = directions => {
    const myRoute = directions.routes[0].legs[0];
    const steps = [];
    myRoute.steps.forEach(step => {
      step.id = step.encoded_lat_lngs;
      step.selected = false;
      steps.push(step);
    });
    this.steps = steps;
    this.directions = directions;
  };

  getDirections = (origin, destination, mode) => {
    return new Promise((resolve, reject) => {
      this.DirectionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode[mode || this.mode]
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            console.error(`error fetching directions ${result}`);
            reject(result);
          }
        }
      );
    });
  };

  selectStep = step => {
    const newSteps = this.steps.map(item => {
      item.selected = item.id === step.id ? true : false;
      return item;
    });

    this.steps = newSteps;
    this.selectedStep = step;
  };

}

const store = new DirectionsStore();
export default store;
