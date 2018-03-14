/* global google, firebase */
import React, { Component } from 'react';
import moment from 'moment';
import CircularProgress from 'material-ui/CircularProgress';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Popover from 'material-ui/Popover';
import Paper from 'material-ui/Paper';
import _ from 'lodash';
import { observer } from 'mobx-react';

import { styles } from '../styles/Theme';
import ModoStore from '../stores/ModoStore';
import DirectionsStore from '../stores/DirectionsStore';
import MapStore from '../stores/MapStore';
import FlexMap from './Map/FlexMap';
import Directions from './Directions/Directions';
import SelectedStep from './Directions/SelectedStep';
import ModoButton from './ModoButton';
import NotificationResource from '../resources/NotificationsResource';

const muiTheme = getMuiTheme({
  fontFamily: 'Proxima Nova  ght, sans-serif',
  chip: styles.chip,
  floatingActionButton: styles.floatingActionButton,
  paper: styles.paper,
  card: styles.card
});

@observer
class App extends Component {
  state = {
    mapLoaded: false
  };

  componentDidMount() {
    MapStore.getLocation();
  }

  mapLoaded = () => {
    this.setState({
      mapLoaded: true
    });
  };

  render() {
    const { mapLoaded } = this.state;
    const { cars, selectModo, selectedCar, modoPopup, target } = ModoStore;
    const { currentLocation, selectedPoint } = MapStore;
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          {(() => {
            if (currentLocation && currentLocation.lat) {
              return (
                <div>
                  <FlexMap
                    loadingElement={<div style={{ height: `100%` }} />}
                    containerElement={<div style={{ height: `400px` }} />}
                    mapElement={<div style={{ height: `100%` }} />}
                    mapStore={MapStore}
                    googleMapURL={
                      'https://maps.googleapis.com/maps/api/js?key=AIzaSyAjf2ss-IiW0kVCh9tRKvF4QGmR_CXJwRA&libraries=geometry,drawing,places&v=3'
                    }
                    directionsStore={DirectionsStore}
                    mapLoaded={this.mapLoaded}
                    modoStore={ModoStore}
                  />
                  {mapLoaded &&
                    DirectionsStore.steps && (
                      <SelectedStep
                        step={DirectionsStore.steps.find(step => step.selected)}
                        searchNewDirections={
                          DirectionsStore.searchNewDirections
                        }
                      />
                    )}
                  {mapLoaded &&
                  DirectionsStore.directions &&
                  DirectionsStore.directions.routes ? (
                    <Directions
                      selectStep={DirectionsStore.selectStep}
                      steps={DirectionsStore.steps}
                      searchNewDirections={this.searchNewDirections}
                      showDetail={this.showDetail}
                      details={DirectionsStore.detailSteps}
                    />
                  ) : (
                    <Paper style={paperStyle}>
                      <span>Search for a destination to start</span>
                    </Paper>
                  )}

                  {modoPopup && (
                    <Popover
                      open={modoPopup}
                      anchorEl={target}
                      style={{ padding: '10px 8px 8px 8px' }}
                      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                      targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                      onRequestClose={() => {
                        this.setState({
                          modoPopup: false,
                          selectedCar: {},
                          target: {}
                        });
                      }}>
                      <ModoButton selectedCar={selectedCar} />
                    </Popover>
                  )}
                </div>
              );
            }
            return (
              <div>
                <CircularProgress
                  size={150}
                  thickness={5}
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                <h3
                  style={{
                    position: 'fixed',
                    top: '75%',
                    left: '50%',
                    textAlign: 'center',
                    transform: 'translate(-50%, -50%)'
                  }}>
                  Getting Current Location...
                </h3>
              </div>
            );
          })()}
        </div>
      </MuiThemeProvider>
    );
  }
}

const paperStyle = {
  margin: '20px 15%',
  height: '100px',
  padding: '15px',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};
export default App;
