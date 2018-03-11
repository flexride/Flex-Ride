/* global google */
import { observable } from 'mobx';


class MapStore {
  @observable refs = {}
  @observable searchBoxRef = null
  @observable markers = []
  @observable currentLocation = null
  @observable center = null
  @observable selectedPoint = null

  getLocation = () => {
    if (navigator && navigator.geolocation) {
      console.log('checking location');
      //todo:
      ////////////////
      const jonnysHouse = {
        latitude: 49.234826899999995,
        longitude: -123.02521259999999
      }
      const position = {
        lat: jonnysHouse.latitude,
        lng: jonnysHouse.longitude
      };
      this.currentLocation = position;
      this.markers = [{ position }];


      ///////////
      /// remove
      //   navigator.geolocation.getCurrentPosition(pos => {
      //     console.log('pos', pos)
      //     const { coords } = pos;
      //     const position = {
      //       lat: coords.latitude,
      //       lng: coords.longitude
      //     };
      //     this.currentLocation = position;
      //     this.markers = [{ position }];
      //   });
    }
  }

  selectPoint = e => {
    this.selectPoint = e.latLng;
  };

  setRef = (type, ref) => {
    this.refs[type] = ref;
    console.log('setting ref')
    console.log(type, this.refs[type])
  }
}

const store = new MapStore();
export default store;
