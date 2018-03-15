import React, { Component } from 'react';
import moment from 'moment';
import DirectionsStore from 'stores/DirectionsStore';
import styled from 'styled-components';
import Paper from 'material-ui/Paper';
import MapsDirectionsWalk from 'material-ui/svg-icons/maps/directions-walk';
import ImageAdjust from 'material-ui/svg-icons/image/adjust';
import MapsDirectionsTransit from 'material-ui/svg-icons/maps/directions-transit';
import MapsDirectionsBike from 'material-ui/svg-icons/maps/directions-bike';
import NotificationDriveEta from 'material-ui/svg-icons/notification/drive-eta';
import MapsPlace from 'material-ui/svg-icons/maps/place';
import RaisedButton from 'material-ui/RaisedButton';
import Popover from 'material-ui/Popover';
import _ from 'lodash';
import TransitStore from 'stores/TransitStore';
import TransitInfo from 'stores/TransitInfo.json';

import PopoverStep from './PopoverStep';

class Directions extends Component {
  state = {
    openPopover: false,
    detailsSteps: ''
  };

  getModeIcon(mode) {
    switch (mode) {
      case 'TRANSIT':
        return <MapsDirectionsTransit />;
      case 'WALKING':
        return <MapsDirectionsWalk />;
      case 'BICYCLING':
        return <MapsDirectionsBike />;
      case 'DRIVING':
        return <NotificationDriveEta />;
      default:
        return null;
    }
  }

  getBackgroundColor(mode, selected) {
    if (selected) {
      return 'green';
    }
    switch (mode) {
      case 'TRANSIT':
        return 'blue';
      case 'BICYCLING':
        return 'orange';
      case 'DRIVING':
        return 'gray';
      default:
        return null;
    }
  }

  handleRequestClose = () => {
    this.setState({
      openPopover: false
    });
  };

  showDetail = step => {
    this.setState({ openPopover: false });
    DirectionsStore.showDetail = true;
    const start_location = step.start_location;
    const end_location = step.end_location;
    DirectionsStore.getDirections(
      start_location,
      end_location,
      step.travel_mode
    ).then(res => {
      const steps = res.routes[0].legs[0].steps;
      this.setState({ detailsSteps: steps });
    });
  };

  selectMode = mode => {
    const { steps } = this.props;
    const step = steps.find(step => step.selected);
    DirectionsStore.searchNewDirections(step, mode);
    this.setState({ openPopover: false });
  };

  render() {
    const { directions, steps } = DirectionsStore;
    const { detailsSteps } = this.state;
    const leg = directions.routes[0].legs[0];
    let duration = 0;
    let distance = 0;
    for (let i = 0; i < steps.length; i++) {
      duration += steps[i].duration.value;
      distance += steps[i].distance.value;
    }
    const startAdd = leg.start_address;
    const destinationAdd = leg.end_address;
    const departureTime = moment().format('LT');
    const arrivalTime = moment().add(duration, 's').format('LT');
    const durationTime = moment.duration(duration, 'seconds').humanize();

    const transits = steps.filter(step => {
      return step.travel_mode === 'TRANSIT';
    });
    const transitInfo = transits[0].transit;
    console.log('info: ', transitInfo);
    console.log(TransitStore.getTransitPrice(transitInfo));
    return (
      <DirectionContainer className="Directions">
        <Paper style={styles.paperStyle}>
          <div>{`${departureTime} - ${arrivalTime}`}</div>
          <div>
            {durationTime}
          </div>
          <div>
            {`(${(distance / 1000).toFixed(2)} KM)`}
          </div>
          <TotalText>
            <ImageAdjust /> {startAdd}
          </TotalText>
          <div>
            {steps.map((step, i) => {
              const { selected } = step;
              const distance = step.distance.text;
              const duration = step.duration.text;
              const mode = step.travel_mode;
              const humanizeMode = _.upperFirst(mode.toLowerCase());

              return (
                <div
                  key={`icon-${i}`}
                  onClick={e => {
                    if (mode !== 'WALKING') {
                      this.setState({
                        openPopover: true,
                        anchorEl: e.currentTarget
                      });
                      this.props.selectStep(step);
                    }
                  }}>
                  <RaisedButton
                    fullWidth
                    disabledBackgroundColor={
                      mode === 'WALKING' ? '#ffffff' : ''
                    }
                    overlayStyle={{ textAlign: 'left' }}
                    disabledLabelColor={mode === 'WALKING' ? '#000000' : ''}
                    backgroundColor={this.getBackgroundColor(mode, selected)}
                    disabled={mode === 'WALKING' ? true : false}
                    icon={this.getModeIcon(mode)}
                    label={`${humanizeMode} ${distance} (${duration})`}
                    onClick={() => {}}
                  />
                  {step.selected &&
                    DirectionsStore.showDetail &&
                    detailsSteps &&
                    detailsSteps.map((step, j) => {
                      let transitInstruction;
                      if (step.travel_mode === 'TRANSIT') {
                        transitInstruction = `${step.transit.departure_stop
                          .name} - ${step.transit.arrival_stop.name} (${step
                          .transit.num_stops} stop(s))`;
                      }
                      const instruction = step.instructions.replace(
                        /<\/?[^>]+(>|$)/g,
                        ''
                      );
                      return (
                        <div key={`detail-step-${j}`}>
                          {instruction}
                          {transitInstruction &&
                            <div>
                              {transitInstruction}
                            </div>}
                        </div>
                      );
                    })}
                </div>
              );
            })}
            <Popover
              open={this.state.openPopover}
              anchorEl={this.state.anchorEl}
              anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
              targetOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              onRequestClose={this.handleRequestClose}>
              <PopoverStep
                step={steps.find(step => step.selected)}
                selectNewMode={this.selectMode}
                showDetail={this.showDetail}
              />
            </Popover>
            <TotalText>
              <MapsPlace /> {destinationAdd}
            </TotalText>
          </div>
        </Paper>
      </DirectionContainer>
    );
  }
}

const styles = {
  paperStyle: {
    margin: '0px 15%',
    padding: '15px',
    textAlign: 'left'
  }
};

const TotalText = styled.div`
  margin-left: 12px;
  height: 30px;
  over-flow: hidden;
`;

const DirectionContainer = styled.div`margin-top: 30px;`;

export default Directions;
