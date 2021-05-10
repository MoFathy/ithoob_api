const gcm = require("node-gcm");
const {notificationKey} = require("./../config/keys");
// set configuration for android
const sender = new gcm.Sender(notificationKey.fcm_api_key);
const {sendMessage} = require("./smsController");

// set the configuration for ios notification
// var apn = require('apn');

// let options = {
//   pfx: "./config/AmenApp_Production_Certificate.p12",
//   passphrase: notificationKey.certificate_pass,
//   production: true
// }
// var apnProvider = new apn.Provider(options);

module.exports.updateOrder = (order, status, res) => {
  let updateObj = {status: status};
  if (status == "production")
    updateObj.production_date = Date.now();
  else if (status == "delivered")
    updateObj.delivery_date = Date.now();
  else if (status == "pickable")
    updateObj.pickable_date = Date.now();
  else if (status == "cancelled")
    updateObj.cancellation_date = Date.now();
  order
    .update(updateObj)
    .then(() => {
      const message = new gcm.Message();
      const regTokens = [];

      // content for android notification
      message.addNotification("title", "Your order status is updated");
      message.addNotification(
        "body",
        `Your order no. ${order.id} is now ${status}`
      );
      if (
        order.User.Metas.find((meta) => {meta.type === "os"}) &&
        order.User.Metas.find((meta) => {meta.type === "os"}).value === "android"
      ) {
        regTokens.push(order.User.Metas.find((meta) => {meta.type === "uuid"}).value);
      }
      // send notification for android
      sender.send(
        message,
        {
          registrationTokens: regTokens
        },
        function (err, response) {
          // if (err) console.error("er", err);
          // else //console.log("res", response);
        }
      );

      // const notification = new apn.Notification();
      // const deviceToken = [];
      // set the configuration for ios notification
      // notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
      // notification.badge = 3;
      // notification.payload = {
      //   messageFrom: "ITHOOB"
      // };
      // notification.sound = "default";


      // content for ios notification
      //  notification.topic = "com.webkeyz..";
      //  notification.alert = "Your order status is updated";
      //  notification.title = "Your order status is updated";
      //  notification.body = `Your order no. ${order.id} is now ${status}`;
      //  notification.aps["requestType"] = '5';

      // send notification for ios
      // apnProvider.send(notification, deviceToken).then(result => {
      //   //console.log(result);
      // });

      sendMessage(
        [order.User.mobile],
        `your order ${order.id} is now ${status}`,
        "IThoob"
      );
      res.status(200).json({
        status: true,
        message: "updated successfully"
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: "error in updating order"
      });
    });
};
