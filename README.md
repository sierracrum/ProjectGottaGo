# ProjectGottaGo
A Slack bot that tells you if bathrooms are available and optionally notifies you when one becomes available


## Components
* Raspberry pi occupancy sensor
* API to collect sensor data
* Slack Bot
* Database to store current status
* UI

## Hardware Required ( per bathroom )
* Raspberry pi (including power supply, case, SIM card, power supply)
* Magnetic door sensor
* wiring needed to connect door sensor to pi 


## API / Slackbot
Node.js app running in Lambda with API Gateway

### Endpoints ###
> post /status

Json Body
<pre>
{ "building": "Elm",
  "floor": "1",
  "id": "left"
}
</pre>


### Slack Command    
/ gottago

<pre>
These bathrooms are available:

Elm F1 Left
Elm F2 Left
Elm F2 Right

Notify-F3

</pre>


<pre>
No bathrooms are available:

NOTIFY   NOTIFY-F1   NOTIFY-F2   Notify-F3
</pre>

Notification
<pre>
Elm F1 Left is now available
</pre>