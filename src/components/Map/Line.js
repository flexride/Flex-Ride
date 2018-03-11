import React from 'react';
import { Polyline } from 'react-google-maps';

const Line = (props) => {
  let color = 'blue';
  switch (props.step.travel_mode) {
    case 'WALKING':
      color = 'gray';
      break;
    case 'WALKING':
      color = 'yellow';
      break;
    case 'DRIVING':
      color = 'black';
      break;
    case 'BICYCLING':
      color = 'orange';
      break;
    default:
      break;
  }
  if (props.step.selected) {
    color = 'green';
  }
  return (
    <Polyline
      path={props.step.lat_lngs}
      options={{
        strokeColor: color,
        strokeWeight: 5
      }}
      onClick={e => {
        if (!props.step.new) {
          props.selectStep(props.step);
        }
        props.selectPoint(e);
      }}
    />
  )
}

export default Line;