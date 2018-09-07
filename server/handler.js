const AWS = require("aws-sdk");
const uuid = require("uuid");
const _ = require("lodash");
const axios = require("axios");
const dbTableNameStatus = "risk-gtg-status";
const dbTableNameUser = "risk-gtg-user";
// const dynamoDb = require('./db/dynamodb');
AWS.config.update({
    region: process.env.R_AWS_REGION,
    accessKeyId: process.env.R_AWS_KEY,
    secretAccessKey: process.env.R_AWS_SECRET
});
const dynamoDb = new AWS.DynamoDB();

const generatePolicy = (principalId, effect, resource) => {
    let authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
}

module.exports.auth = (event, context, callback) => {
    // if (!event.authorizationToken) {
    //     callback('Unauthorized')
    // }

    // const tokenParts = event.authorizationToken.split(' ');
    // const tokenValue = tokenParts[1];

    // if (!(tokenParts[0].toLowerCase() === 'Bearer' && tokenValue)) {
    //     callback('Unauthorized');
    // }

    // if (tokenValue !== '9OJniHzRsRCApQbWy70gPfAbpHlPa8uc') {
    callback(null, generatePolicy('demo-user', 'Allow', event.methodArn));
    //} else {
    //callback('Unauthorized');
    //}
};

module.exports.getAllStatuses = (event, context, callback) => {
    const params = {
        TableName: dbTableNameStatus,
        AttributesToGet: [
            'id',
            'buildingId',
            'floorId',
            'doorId',
            'status',
            'dt'
        ]
    };

    dynamoDb.scan(params, (error, result) => {
        if (error) {
            console.log(error);
            callback('Failed getting status', error);
        } else {
            let items = [];
            result.Items.map((item) => {
                items.push({
                    id: item.id.S,
                    doorId: parseInt(item.doorId.N),
                    floorId: parseInt(item.floorId.N),
                    buildingId: parseInt(item.buildingId.N),
                    status: parseInt(item.status.N),
                    dt: item.dt.S
                });
            });
            callback(null, _.sortBy(items, 'dt').reverse());
        }
    });
}

module.exports.getStatusById = (event, context, callback) => {
    const params = {
        TableName: dbTableName,
        Key: {
            id: event.path.id,
        },
    };
    dynamoDb.get(params, (error, result) => {
        if (error) {
            console.error(error);
            callback("Failed fetching status", null);
        } else {
            callback(null, JSON.stringify(result.Item));
        }
    });
}

module.exports.createStatus = (event, context, callback) => {
    const data = event.body;

    if (!data) {
        callback('Status data required', null);
    }

    if (!data.buildingId) {
        callback('Building ID required', null);
    }

    if (!data.floorId) {
        callback('Floor ID required', null);
    }

    if (!data.doorId) {
        callback('Door ID required', null);
    }

    const params = {
        TableName: dbTableNameStatus,
        Item: {
            'id': {
                S: uuid.v1()
            },
            'buildingId': {
                N: data.buildingId.toString()
            },
            'floorId': {
                N: data.floorId.toString()
            },
            'doorId': {
                N: data.doorId.toString()
            },
            'status': {
                N: data.status.toString()
            },
            'dt': {
                S: new Date().getTime().toString()
            }
        }
    };
    const dynamoDb = new AWS.DynamoDB();
    dynamoDb.putItem(params, function (error, data) {
        if (error) {
            console.log(error);
            callback('Failed storing status', error);
        } else {
            // get users by active 0
            const params = {
                TableName: dbTableNameUser,
                AttributesToGet: [
                    'id',
                    'userId',
                    'userName',
                    'dt'
                ]
            };
            dynamoDb.scan(params, (error, result) => {
                if (error) {
                    console.log(error);
                    callback('Failed fetching users', error);
                } else {
                    
                    // axios.post(`https://slack.com/api/im.open?token=${process.env.SLACK_TOKEN}&user=UCN0W2FQR`, {
                    //     headers: {
                    //         'Content-Type': 'application/json'
                    //     }
                    // }).then((res) => {
                    //     console.log('open res', res);
                    //     axios.post(`https://slack.com/api/chat.postMessage?token=${process.env.SLACK_TOKEN}&channel=${res.data.channel.id}&text=Bathroom F1 is open`)
                    //     .then((res) => {
                    //         console.log('msg res', res)
                    //     });
                    // });

                    // send notification
                    /*result.Items.map((user) => {
                        const userName = user.userName.S;
                        const userId = user.userId.S;
                        const id = user.userId.S;
                        const action = user.action.S;

                        // check user action

                        // if any notify

                        // if action is floor, match the door to what got submitted

                    });

                    // delete user
                    var params = {
                        TableName: dbTableNameUser,
                        Key: { "id": {
                                "S" : result.Items[0].id.S.toString()
                            }
                        }
                    };

                    dynamoDb.deleteItem(params, function(err, data) {
                        
                        if (error) {
                            console.log(error);
                            callback('Failed fetching users', error);
                        } else {*/

                            // all done
                            callback(null, true);

                        //}

                    //});

                    
                }
            });
        }
    });
}

module.exports.slackStatus = (event, context, callback) => {

    console.log('body', event.body);

    const params = {
        TableName: dbTableNameStatus,
        AttributesToGet: [
            'id',
            'buildingId',
            'floorId',
            'doorId',
            'status',
            'dt'
        ]
    };

    dynamoDb.scan(params, (error, result) => {
        if (error) {
            console.log(error);
            callback('Failed getting status', error);
        } else {

            let floors = [];
            let openFloorTxt = '';
            let items = [];


            // sort
            result.Items.map((item) => {
                items.push({
                    id: item.id.S,
                    doorId: parseInt(item.doorId.N),
                    floorId: parseInt(item.floorId.N),
                    buildingId: parseInt(item.buildingId.N),
                    status: parseInt(item.status.N),
                    dt: item.dt.S
                });
            });
            const itemsSorted = _.sortBy(items, 'dt').reverse();

            // // get only the last door record
            itemsSorted.map((item) => {
                const index = _.findIndex(floors, {
                    doorId: item.doorId,
                    floorId: item.floorId
                });
                if (index === -1) {
                    floors.push(item);
                }
            });
            
            
            // // get open doors
            let resultTxt = '';
            let availList = {};
            let unAvailList = [];
            
            for (let i = 0; i < floors.length; i++) {
                if (floors[i].status === 1) {
                    if (availList[floors[i].floorId]) {
                        availList[floors[i].floorId]++;
                    } else {
                        availList[floors[i].floorId] = 1;
                    }
                } else {
                    unAvailList.push(floors[i].floorId);
                }
            }

            for (var key in availList) {
                let str = "F" + key + ": " + availList[key] + " available\n";
                resultTxt += str;
            }

            openFloorTxt = resultTxt.slice(0, resultTxt.length - 1);

            let res = {
                "text": "Available Bathrooms: ",
                "attachments": [{
                    "text": openFloorTxt,
                    "callback_id": "notify",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [{
                            "name": "notify",
                            "text": "Notify All",
                            "style": "danger",
                            "type": "button",
                            "value": "all"
                        },
                        {
                            "name": "notify",
                            "text": "Notify F1",
                            "type": "button",
                            "value": "F1"
                        },
                        {
                            "name": "notify",
                            "text": "Notify F2",
                            "type": "button",
                            "value": "F2"
                        },
                        {
                            "name": "notify",
                            "text": "Notify F3",
                            "type": "button",
                            "value": "F3"
                        }
                    ]
                }]
            };

            callback(null, res);
        }
    });

}

module.exports.slackStatusNotify = (event, context, callback) => {
    const data = JSON.parse(event.body.payload);
    console.log(data);
    const params = {
        TableName: dbTableNameUser,
        Item: {
            'id': {
                S: uuid.v1()
            },
            'userId': {
                N: data.payload.user.id
            },
            'userName': {
                S: data.payload.user.name
            },
            'action': {
                S: data.actions[0].value
            },
            'dt': {
                S: new Date().getTime().toString()
            }
        }
    };
    const dynamoDb = new AWS.DynamoDB();
    dynamoDb.putItem(params, function (error, data) {
        if (error) {
            console.log(error);
            callback('Failed storing status', error);
        } else {
            callback(null, true);
        }
    });

}

const availableGifs = [
    'https://giphy.com/gifs/excited-screaming-jonah-hill-5GoVLqeAOo6PK',
    'https://giphy.com/gifs/excited-yes-nicolas-cage-RrVzUOXldFe8M',
    'https://giphy.com/gifs/JltOMwYmi0VrO',
    'https://giphy.com/gifs/mrw-wall-thedonald-WUq1cg9K7uzHa',
    'https://giphy.com/gifs/friends-excited-31lPv5L3aIvTi',
    'https://giphy.com/gifs/excited-oprah-shouting-y8Mz1yj13s3kI',
    'https://giphy.com/gifs/excited-fx-charlie-3oKIP9iTS7Ze73m1P2',
    'https://giphy.com/gifs/seinfeld-preseason-aMh59aKR8vjdC',
    'https://giphy.com/gifs/carlton-fresh-prince-dance-3o7abldj0b3rxrZUxW',
    'https://giphy.com/gifs/wwe-wrestling-excited-cbG9wtoO8QScw',
    'https://giphy.com/gifs/excited-jessica-chastain-finally-yIsbuPCEOgNHO',
    'https://giphy.com/gifs/yes-applause-shakira-13mbTHVskEHyGA',
    'https://giphy.com/gifs/finally-its-about-time-took-long-enough-AuwBPJztsEWkw',
    'https://giphy.com/gifs/yes-agree-totes-sIfvjuG26APYI'
];

const oneAvailableGifs = [
    'https://giphy.com/gifs/run-forrest-gump-l2Sqc3POpzkj5r8SQ',
    'https://giphy.com/gifs/rockymovie-movie-rocky-sylvester-stallone-1iTH1WIUjM0VATSw',
    'https://giphy.com/gifs/breakingbad-run-breaking-bad-l0HUjziiiniIsRUY0',
    'https://giphy.com/gifs/running-muppets-7kn27lnYSAE9O',
    'https://giphy.com/gifs/tvonetv-scared-run-3oKIPoZniJ2hq8IItG',
    'https://giphy.com/gifs/filmeditor-christmas-movies-the-polar-express-3otPotP0eZDYu3sPpm',
    'https://giphy.com/gifs/pizza-bored-april-ludgate-wAClK9HIiBdBu',
    'https://giphy.com/gifs/kuFDac2MnJN2U',
    'https://giphy.com/gifs/judge-judy-hurry-up-Emg9qPKR5hquI',
    'https://giphy.com/gifs/hurry-6QXdPW7qzTVxC',
    'https://giphy.com/gifs/ufc-mma-ufc-205-l2SpMwIcaPAVg8dnq',
    'https://giphy.com/gifs/jeff-goldblum-jurassic-park-jurassicparkedit-7XsFGzfP6WmC4',
    'https://giphy.com/gifs/hells-kitchen-fox-gordon-ramsay-l4pT47HmuSgXIyXbq'
];

const noneAvailableGifs = [
    'https://giphy.com/gifs/angry-the-office-screaming-3t7RAFhu75Wwg',
    'https://giphy.com/gifs/funny-LX5lCAnX1yais',
    'https://giphy.com/gifs/angry-frustrated-lizzie-mcguire-ug9SeZBFLKHtK',
    'https://giphy.com/gifs/snl-l3978hPCi5iREQk5W',
    'https://giphy.com/gifs/reactiongifs-Rhkq4ehWqVX56',
    'https://giphy.com/gifs/sad-not-fair-crying-CMRWlA55AYLpS',
    'https://giphy.com/gifs/made-frank-creator-jSfiX3lj42RDG',
    'https://giphy.com/gifs/teamcoco-crying-cry-l2JhtKtDWYNKdRpoA',
    'https://giphy.com/gifs/angry-mad-classic-8pMS5BXOUVZyo',
    'https://giphy.com/gifs/angry-mad-frustrated-xUOxfeS1G9NTxN02Ag',
    'https://giphy.com/gifs/KDRv3QggAjyo',
    'https://giphy.com/gifs/mrw-song-myself-Ty9Sg8oHghPWg',
    'https://giphy.com/gifs/hells-kitchen-hells-kitchen-gordon-ramsay-l3V0H7bYv5Ml5TOfu',
    'https://giphy.com/gifs/eye-roll-ryan-reynolds-ugh-54PaD9dWT0go',
    'https://giphy.com/gifs/friends-why-frustrated-4qmcuu67Hxx0Q',
    'https://giphy.com/gifs/mrw-reddit-comment-tJeGZumxDB01q',
    'https://giphy.com/gifs/partner-put-ilkfz8Mn5Yz7O'
];

const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
}