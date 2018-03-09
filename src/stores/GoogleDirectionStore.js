/* global google */
import { observable } from 'mobx';

export class GoogleDirectionStoreClass {
  constructor() {
    this.DirectionsService = new google.maps.DirectionsService();
    //always default to transit
    this.mode = 'TRANSIT';
    this.showDetail = false;
  }
  refs = {};

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

const store = new GoogleDirectionStoreClass();
export default store;
