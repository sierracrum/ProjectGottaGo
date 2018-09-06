const AWS = require("aws-sdk");
const uuid = require("uuid");
const _ = require("lodash");
const dbTableName = "status";
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
        TableName: dbTableName,
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
        TableName: dbTableName,
        Item: {
            'id': {S: uuid.v1()},
            'buildingId': {N: data.buildingId.toString()},
            'floorId' : {N: data.floorId.toString()},
            'doorId' : {N: data.doorId.toString()},
            'status' : {N: data.status.toString()},
            'dt' : {S: new Date().getTime().toString()}
        }
    };
    const dynamoDb = new AWS.DynamoDB();
    dynamoDb.putItem(params, function(error, data) {
        if (error) {
            console.log(error);
            callback('Failed storing status', error);
        } else {
            callback(null, true);
        }
    }); 
}

module.exports.slackStatus = (event, context, callback) => {
    
    const params = {
        TableName: dbTableName,
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

            let res = {
                "text": "Available Bathrooms: ",
                "attachments": [
                    {
                        "text":"Elm F1 West\nElm F2 East"
                    }
                ]
            };

            // sort data
            // let items = [];
            // result.Items.map((item) => {
            //     items.push({
            //         id: item.id.S,
            //         doorId: parseInt(item.doorId.N),
            //         floorId: parseInt(item.floorId.N),
            //         buildingId: parseInt(item.buildingId.N),
            //         status: parseInt(item.status.N),
            //         dt: item.dt.S
            //     });
            // });
            // const itemsSorted = _.sortBy(items, 'dt')

            callback(null, res);
        }
    });
}

module.exports.slackStatusNotify = (event, context, callback) => {
    callback(null, true);
}