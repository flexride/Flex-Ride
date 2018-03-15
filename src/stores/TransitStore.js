import { observable, action } from 'mobx';
import _ from 'lodash';
import TransitInfo from 'stores/TransitInfo.json';

class TransitStore {
  getStationName(stationName) {
    const underscore = _.snakeCase(stationName);
    const split = _.split(underscore, 'station');
    const station = _.snakeCase(split);
    return station;
  }

  getTransitPrice(transitInfo) {
    let regularPrice = 2.2;
    const skytrain = ['expo_line', 'millennium_line', 'canada_line'];
    const start = this.getStationName(transitInfo.departure_stop.name);
    const end = this.getStationName(transitInfo.arrival_stop.name);
    const line = this.getStationName(transitInfo.line.short_name);
    if (_.indexOf(skytrain, line) > -1) {
      //skytrain fee
      const startZone = TransitInfo[line][start].zone;
      const endZone = TransitInfo[line][end].zone;
      console.log(startZone, endZone);
      const diff = Math.abs(endZone - startZone);
      if (diff > 0) {
        if (diff === 1) {
          regularPrice = regularPrice + 1.25;
        }
        if (diff === 2) {
          regularPrice = regularPrice + 1.25;
        }
        return regularPrice;
      }
    } else {
      //bus fee
      return regularPrice;
    }
  }
}

const store = new TransitStore();
export default store;
