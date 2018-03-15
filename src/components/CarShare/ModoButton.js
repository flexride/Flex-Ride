import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
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
          <b>Trip Type: </b>Round Trip
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>Car Info: </b>
          <list>
            <li>{selectedCar.category}</li>
            <li>{`${selectedCar.make} ${selectedCar.model}`}</li>
            <li>{selectedCar.seats} Seats</li>
          </list>
        </div>
        <div>
          <b>Cost Estimate: </b>
          ${estimatedCost}
          <p style={{ fontSize: '0.65em', marginTop: '-2.5px' }}>
            Estimate based on one way trip duration. Price is not including the
            return trip or duration spent at destination.
          </p>
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
