import * as PopperJs from '@popperjs/core';

// TODO: Rename mock

// Popper.js does not work with JSDOM: https://github.com/FezVrasta/popper.js/issues/478
export default class Popper {
  static placements = placements;

  constructor() {
    return {
      destroy: () => {},
      scheduleUpdate: () => {},
      enableEventListeners: () => {},
    };
  }
}
// TODO: => popper/core
