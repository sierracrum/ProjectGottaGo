const AWS = require("aws-sdk");

module.exports.getAllStatuses = (event, context, callback) => {

}

module.exports.getStatusById = (event, context, callback) => {

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

    AWS.config.update({
        region: "us-west-2",
        accessKeyId: process.env.AWS_KEY,
        secretAccessKey: process.env.AWS_SECRET
    });
    const ddb = new AWS.DynamoDB();
    const params = {
        TableName: 'status',
        Item: {
            'buildingId': {N: data.buildingId},
            'floorId' : {N: data.floorId},
            'doorId' : {N: data.doorId},
            'dt' : {S: ''}
        }
    };
    ddb.putItem(params, function(err, data) {
        if (err) {
            callback('Failed storing status', err);
        } else {
            callback(null, true);
        }
    }); 
}