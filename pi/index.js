var gpio = require('rpi-gpio');
var axios = require('axios');
require('dotenv').load();

var laststate = 1;

gpio.setup(process.env.GPIO_PORT, gpio.DIR_IN, readInput);

function readInput() {
  gpio.read(process.env.GPIO_PORT, function (err, value) {
    if (laststate != value) {
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
    laststate = value;
  });
  setTimeout(readInput, 1000); //recheck door every second
}