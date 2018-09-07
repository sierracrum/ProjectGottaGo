var gpio = require("rpi-gpio");
var axios = require("axios");
require("dotenv").load();

var currentstate;
var laststate;

gpio.setup(process.env.GPIO_PORT, gpio.DIR_IN, readInput);

function readInput() {
  gpio.read(process.env.GPIO_PORT, function(err, value) {
    //find the current state
    value === true ? (currentstate = 1) : (currentstate = 0);
  });
  //if the current state changes, update the last state, and post to the database
  if (laststate != currentstate) {
    axios
      .post(process.env.API_URL, {
        buildingId: 1,
        floorId: 1,
        doorId: 1,
        status: currentstate
      })
      .catch(function(error) {
        console.log(error);
      });
    laststate = currentstate;
  }
  setTimeout(readInput, 1000); //recheck door every second
}

// function readInput() {
//   gpio.read(process.env.GPIO_PORT, function(err, value) {
//     if (currentstate != value) {
//       axios
//         .post(process.env.API_URL, {
//           buildingId: 1,
//           floorId: 1,
//           doorId: 1,
//           status: currentstate
//         })
//         .catch(function(error) {
//           console.log(error);
//         });
//     }
//     value === true ? (currentstate = 1) : (currentstate = 0);
//   });
//   setTimeout(readInput, 1000); //recheck door every second
// }