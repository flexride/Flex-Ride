import { observable, action } from 'mobx';
import _ from 'lodash';
import { toJS } from 'mobx';

class TransitStore {
  @observable
  expo_line = {
    waterfront: {
      zone: 1
    },
    burrard: {
      zone: 1
    },
    granville_station: {
      zone: 1
    },
    metotown: {
      zone: 2
    }
  };
}

const store = new TransitStore();
export default store;
