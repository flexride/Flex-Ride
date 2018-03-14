import FetchResource from '../resources/FetchResource';
import { observable } from 'mobx';

class ModoStore {
  @observable nearby = [];
  @observable locations = [];
  @observable cars = [];
  @observable isLoading = true;
  @observable modoPopup = false;
  @observable selectedCar = [];
  @observable target = null;
  @observable estimatedCost = 0;

  getNearby(lat, lng) {
    return new Promise(resolve => {
      FetchResource.callModo(`nearby?lat=${lat}&long=${lng}`)
        .then(res => {
          this.nearby = res.Response;
          resolve();
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  selectModo = (e, car) => {
    this.modoPopup = true;
    this.selectedCar = car;
    this.target = e;
  };

  closeModo = () => {
    this.modoPopup = false;
    this.selectedCar = [];
  };

  clearCars = () => (this.cars = []);

  getCars() {
    return new Promise(resolve => {
      FetchResource.callModo('car_list')
        .then(res => {
          resolve(res.Response['Cars']);
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  getAvailability(id) {
    return new Promise(resolve => {
      FetchResource.callModo(`availability?car_id=${id}`).then(res => {
        if (res.Response['Availability'].length !== 0) {
          resolve(res.Response);
        } else {
          return;
        }
      });
    });
  }

  getPricing(id, start, end, distance) {
    return new Promise(resolve => {
      FetchResource.callModo(
        `cost?car_id=${id}&start=${start}&end=${end}&plan=Roaming`
      ).then(res => {
        if (res.Response['Cost'].length !== 0) {
          resolve(res.Response);
        } else {
          return;
        }
      });
    });
  }

  findCarLocation = (lat, lng) => {
    this.clearCars();
    this.getNearby(lat, lng).then(() => {
      this.findCarsFromLocation();
    });
  };

  findLocationAndAvailability(id) {
    return new Promise(resolve => {
      const locations = this.nearby['Locations'];
      let result = false;
      let loop = false;

      this.getAvailability(id)
        .then(() => {
          locations.forEach(location => {
            if (loop) {
              return;
            }
            if (location['LocationID'] === id) {
              result = {
                lat: location['Latitude'],
                lng: location['Longitude']
              };
              loop = true;
            }
          });
          resolve(result);
        })
        .catch(() => {
          return false;
        });
    });
  }

  findCarsFromLocation = () => {
    return new Promise(resolve => {
      if (this.nearby['Locations'].length > 0) {
        this.getCars().then(cars => {
          if (cars instanceof Object) {
            const locations = this.nearby['Locations'];
            Object.keys(cars).forEach(key => {
              locations.forEach(location => {
                if (
                  cars[key]['Location'][0]['LocationID'] ===
                  location['LocationID']
                ) {
                  this.findLocationAndAvailability(
                    cars[key]['Location'][0]['LocationID']
                  ).then(res => {
                    if (res !== false) {
                      const obj = {
                        id: cars[key]['ID'],
                        make: cars[key]['Make'],
                        model: cars[key]['Model'],
                        category: cars[key]['Category'],
                        year: cars[key]['Year'],
                        seats: cars[key]['Seats'],
                        location_id: cars[key]['Location'][0]['LocationID'],
                        lat: res.lat,
                        lng: res.lng
                      };
                      this.cars.push(obj);
                    }
                  });
                }
              });
            });
            resolve();
          }
        });
      }
    });
  };
}

const store = new ModoStore();
export default store;
