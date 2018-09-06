var gpio = require('rpi-gpio');
var axios = require('axios');
require('dotenv').load();

gpio.setup(process.env.GPIO_PORT, gpio.DIR_IN, readInput);

function readInput() {
  gpio.read(process.env.GPIO_PORT, function (err, value) {
    if (process.env.LAST_STATE != value) {
      axios.post(process.env.API_URL, {
        buildingId: 1,
        floorId: 1,
        doorId: 1,
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    }
    process.env.LAST_STATE = value;
  });
  setTimeout(readInput, 1000); //recheck door every second
}