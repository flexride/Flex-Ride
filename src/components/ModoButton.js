import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import ActionIcon from 'material-ui/svg-icons/action/info';
import moment from 'moment';

class ModoButton extends Component {
  handleClick(e) {
    e.preventDefault();

    window.open(
      `https://bookit.modo.coop/booking?display=select&mobile=0&select_car=${
        this.props.selectedCar.id
      }&pickup_time={${moment().format('hh:mm')}}`,
      '_blank'
    );
  }

  render() {
    const { selectedCar, estimatedCost } = this.props;

    return (
      <div>
        <div>
          <b>Type: </b>
          {selectedCar.category}
        </div>
        <div>
          <b>Car: </b>
          {`${selectedCar.make} ${selectedCar.model}`}
        </div>
        <div>
          <b>Seats: </b>
          {selectedCar.seats}
        </div>
        <div>
          <b>Cost Estimate:</b>
          ${estimatedCost}
          <IconButton
            tooltip="Estimate based on one way trip duration, not including return trip."
            touch={true}
            tooltipPosition="top-right"
            tooltipStyles={{ fontSize: '0.5em' }}>
            <ActionIcon />
          </IconButton>
        </div>
        <FlatButton
          label="Book With Modo"
          onClick={this.handleClick.bind(this)}
          fullWidth={true}
          primary={true}
        />
      </div>
    );
  }
}

export default ModoButton;
