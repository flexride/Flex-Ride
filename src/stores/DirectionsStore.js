/* global google */
import { observable } from 'mobx';


class DirectionsStore {
  @observable DirectionsService = new google.maps.DirectionsService();
  @observable showDetail = false;
  @observable mode = 'TRANSIT';
  @observable direction = {}
  @observable finalDestination = {}

  setDestination = destination => {
    this.finalDestination = destination;
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
}

const store = new DirectionsStore();
export default store;
