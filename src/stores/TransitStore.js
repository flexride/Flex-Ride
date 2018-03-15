import { observable, action } from 'mobx';
import _ from 'lodash';
import moment from 'moment';
import TransitInfo from 'stores/TransitInfo.json';

class TransitStore {
  getStationName(stationName) {
    const underscore = _.snakeCase(stationName);
    const split = _.split(underscore, 'station');
    const station = _.snakeCase(split[0]);
    return station;
  }

  getTransitPrice(transitInfo) {
    const regularPrice = 2.2;
    let addPrice = 0;
    const skytrain = ['expo_line', 'millennium_line', 'canada_line'];
    const start = this.getStationName(transitInfo.departure_stop.name) || 1;
    const end = this.getStationName(transitInfo.arrival_stop.name) || 1;
    const line = this.getStationName(transitInfo.line.short_name);
    const currentTime = moment().format('HHmm');
    const isAfternoon = currentTime >= 1830;
    const day = new Date().getDay();
    const isWeekend = day % 6 === 0;
    if (isWeekend || isAfternoon) {
      return regularPrice;
    }
    if (_.indexOf(skytrain, line) > -1) {
      const startZone = TransitInfo[line][start].zone;
      const endZone = TransitInfo[line][end].zone;
      const diff = Math.abs(endZone - startZone);
      if (diff > 0) {
        if (diff === 1) {
          if (startZone === 3 || endZone === 3) {
            addPrice = 1.5;
          } else {
            addPrice = 1.25;
          }
        }
        if (diff === 2) {
          addPrice = 2.75;
        }
      }

      return regularPrice + addPrice;
    } else {
      return regularPrice;
    }
  }
}

const store = new TransitStore();
export default store;
