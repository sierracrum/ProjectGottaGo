require('dotenv').load();
var gpio = require('rpi-gpio');
var doorpin = 7; //the GPIO port you connected to the cicruit
var server = email.server.connect({
  user: "Username",
  password: "YourPassword",
  host: "smtp.gmail.com",
  ssl: true
});
var laststate = 1;

gpio.setup(doorpin, gpio.DIR_IN, readInput);

function readInput() {
  gpio.read(doorpin, function (err, value) {
    if (laststate != value) {
      console.log(translateStatus(value));
      server.send({ //sending email
        text: translateStatus(value),
        from: "Door <taeminpak@gmail.com>",
        to: "somebody <taeminpak@gmail.com>",
        subject: translateStatus(value)
      }, function (err, message) {
        console.log(err || message);
      });
    }
    laststate = value;
  });

  setTimeout(readInput, 1000); //recheck door every second
}

function translateStatus(s) {
  if (s == 0) return 'The door is now open! ' + getTime();
  else return 'The door is now closed! ' + getTime();
}

function getTime() {
  var h = new Date().getHours();
  var m = new Date().getMinutes();
  var s = new Date().getSeconds();
  if (h < 10) h = '0' + h;
  if (m < 10) m = '0' + m;
  if (s < 10) s = '0' + s;
  return h + ':' + m + ':' + s;
}