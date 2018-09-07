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
            let availList = {};
            let availText = '';
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
                let str = "Floor " + key + ": " + availList[key] + " available\n"
                availText += str
            }
            availText += "\n"

            let gifURL = '';
            let resultTitle = '';
            switch (Object.keys(availList).length) {
                case 0:
                    resultTitle = "Gotta wait, no bathrooms are available!"
                    gifURL = _.sample(noneAvailableGifs)
                    break;
                case 1:
                    resultTitle = "Gotta hurry, one bathrooms is available!"
                    gifURL = _.sample(oneAvailableGifs)
                    break;
                default:
                    resultTitle = "Gotta choose, there are multiple bathrooms available!"
                    gifURL = _.sample(availableGifs)
            }

            let res = {

                "attachments": [{
                    "pretext": resultTitle,
                    "text": availText,
                    "callback_id": "notify",
                    "color": "good",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "notify",
                            "text": "Notify option...",
                            "type": "select",
                            "options": [
                                {
                                    "text": "Any",
                                    "value": "any"
                                },
                                {
                                    "text": "1st Floor",
                                    "value": "1"
                                },
                                {
                                    "text": "2nd Floor",
                                    "value": "2"
                                },
                                {
                                    "text": "3rd Floor",
                                    "value": "3"
                                }
                            ]
                        }
                    ]
                },
                {
                    "text": "GottaGo",
                    "image_url": gifURL,
                }
                ]

            }

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
    'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
    'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
    'https://media.giphy.com/media/JltOMwYmi0VrO/giphy.gif',
    'https://media.giphy.com/media/WUq1cg9K7uzHa/giphy.gif',
    'https://media.giphy.com/media/31lPv5L3aIvTi/giphy.gif',
    'https://media.giphy.com/media/y8Mz1yj13s3kI/giphy.gif',
    'https://media.giphy.com/media/3oKIP9iTS7Ze73m1P2/giphy.gif',
    'https://media.giphy.com/media/aMh59aKR8vjdC/giphy.gif',
    'https://media.giphy.com/media/3o7abldj0b3rxrZUxW/giphy.gif',
    'https://media.giphy.com/media/cbG9wtoO8QScw/giphy.gif',
    'https://media.giphy.com/media/yIsbuPCEOgNHO/giphy.gif',
    'https://media.giphy.com/media/13mbTHVskEHyGA/giphy.gif',
    'https://media.giphy.com/media/AuwBPJztsEWkw/giphy.gif',
    'https://media.giphy.com/media/sIfvjuG26APYI/giphy.gif'
];

const oneAvailableGifs = [
    'https://media.giphy.com/media/l2Sqc3POpzkj5r8SQ/giphy.gif',
    'https://media.giphy.com/media/1iTH1WIUjM0VATSw/giphy.gif',
    'https://media.giphy.com/media/l0HUjziiiniIsRUY0/giphy.gif',
    'https://media.giphy.com/media/7kn27lnYSAE9O/giphy.gif',
    'https://media.giphy.com/media/3oKIPoZniJ2hq8IItG/giphy.gif',
    'https://media.giphy.com/media/wAClK9HIiBdBu/giphy.gif',
    'https://media.giphy.com/media/kuFDac2MnJN2U/giphy.gif',
    'https://media.giphy.com/media/Emg9qPKR5hquI/giphy.gif',
    'https://media.giphy.com/media/6QXdPW7qzTVxC/giphy.gif',
    'https://media.giphy.com/media/l2SpMwIcaPAVg8dnq/giphy.gif',
    'https://media.giphy.com/media/7XsFGzfP6WmC4/giphy.gif',
    'https://media.giphy.com/media/l4pT47HmuSgXIyXbq/giphy.gif'
];

const noneAvailableGifs = [
    'https://media.giphy.com/media/3t7RAFhu75Wwg/giphy.gif',
    'https://media.giphy.com/media/LX5lCAnX1yais/giphy.gif',
    'https://media.giphy.com/media/ug9SeZBFLKHtK/giphy.gif',
    'https://media.giphy.com/media/l3978hPCi5iREQk5W/giphy.gif',
    'https://media.giphy.com/media/Rhkq4ehWqVX56/giphy.gif',
    'https://media.giphy.com/media/CMRWlA55AYLpS/giphy.gif',
    'https://media.giphy.com/media/jSfiX3lj42RDG/giphy.gif',
    'https://media.giphy.com/media/l2JhtKtDWYNKdRpoA/giphy.gif',
    'https://media.giphy.com/media/8pMS5BXOUVZyo/giphy.gif',
    'https://media.giphy.com/media/xUOxfeS1G9NTxN02Ag/giphy.gif',
    'https://media.giphy.com/media/KDRv3QggAjyo/giphy.gif',
    'https://media.giphy.com/media/Ty9Sg8oHghPWg/giphy.gif',
    'https://media.giphy.com/media/l3V0H7bYv5Ml5TOfu/giphy.gif',
    'https://media.giphy.com/media/54PaD9dWT0go/giphy.gif',
    'https://media.giphy.com/media/4qmcuu67Hxx0Q/giphy.gif',
    'https://media.giphy.com/media/tJeGZumxDB01q/giphy.gif',
    'https://media.giphy.com/media/tJeGZumxDB01q/giphy.gif'
];

const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
}