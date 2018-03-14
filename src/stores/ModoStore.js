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
    // const estimatedCost = this.getAvailability(car.id, )
    //
    // this.estimatedCost = estimatedCost
  };

  clearCars = () => (this.cars = []);

  getCars() {
    return new Promise(resolve => {
      FetchResource.callModo('car_list')
        .then(res => {
          this.getLocations().then(() => {
            resolve(res.Response['Cars']);
          });
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  getLocations() {
    return new Promise(resolve => {
      FetchResource.callModo('location_list')
        .then(res => {
          this.locations = res.Response['Locations'];
          resolve();
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
      const locations = this.locations;
      let result = false;

      this.getAvailability(id)
        .then(() => {
          for (let key in locations) {
            if (locations[key]['ID'] === id) {
              result = {
                lat: locations[key]['Latitude'],
                lng: locations[key]['Longitude']
              };
              break;
            }
          }
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
            console.log('cars in store', this.cars);
            resolve();
          }
        });
      }
    });
  };
}

const store = new ModoStore();
export default store;
