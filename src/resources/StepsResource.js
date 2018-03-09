export default class StepsResource {
  getStepsArray = res => res.routes[0].legs[0].steps;
  getRoutesArray = res => res.routes[0];
};