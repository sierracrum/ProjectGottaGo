
const async = require("async");
const axios = require("axios");

const getUserMessages = (users, floorId) => {
    let messages = [];
    result.Items.map((user) => {
        const userId = user.userId.S;
        const id = user.userId.S;
        const action = user.action.S;

        // check user action
        if (action === 'any' || data.floorId === action) {
            messages.push({
                id: id,
                userId: userId,
                msg: `Bathrooms on floor ${data.floorId} are open`
            })
        }
    });
    return messages;
};  

const sendNotifications = (messages, floorId, cb) => {
    async.map(messages, (message, callback) => {

        axios.post(`https://slack.com/api/im.open?token=${process.env.SLACK_TOKEN}&user=${message.userId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            console.log('open res', res);
            axios.post(`https://slack.com/api/chat.postMessage?token=${process.env.SLACK_TOKEN}&channel=${res.data.channel.id}&text=${message.msg}`)
            .then((res) => {
                console.log('msg res', res)
                callback(null, message);
            });
        });

    }, (error, res) => {

        if (error) {
            cb(error, null);
        } else {
            cb(null, res);
        }

    });
};

const deleteUsers = (messages, dynamoDb, cb) => {
    async.map(messages, (message, callback) => {

        var params = {
            TableName: dbTableNameUser,
            Key: { "id": { "S" : message.id } }
        };

        dynamoDb.deleteItem(params, (error, data) => {

            if (error) {
                callback(error, null);
            } else {
                callback(null, data);
            }

        });

    }, (error, res) => {
        if (error) {
            cb(error, null);
        } else {
            cb(null, res);
        }
    });  
};

module.exports = {
    getUserMessages,
    sendNotifications,
    deleteUsers
};