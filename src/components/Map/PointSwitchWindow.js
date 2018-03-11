import React from 'react';
import { InfoWindow } from 'react-google-maps';

const PointSwithWindow = ({ switchFromPoint }) => {
  return (
    <InfoWindow>
      <div>
        <div
          onClick={() => {
            switchFromPoint('WALKING');
          }}>
          {' '}Walk{' '}
        </div>
        <div
          onClick={() => {
            switchFromPoint('DRIVING');
          }}>
          {' '}Drive{' '}
        </div>
        <div
          onClick={() => {
            switchFromPoint('TRANSIT');
          }}>
          {' '}Transit{' '}
        </div>
        <div
          onClick={() => {
            switchFromPoint('BICYCLING');
          }}>
          {' '}Bike{' '}
        </div>
      </div>
    </InfoWindow>
  )
}

export default PointSwithWindow;