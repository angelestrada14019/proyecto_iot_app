const express = require("express");
const router = express.Router();
const axios = require("axios");
const colors = require("colors");
let mqtt = require("mqtt");
const { checkAuth } = require('../middlewares/authentication');

import Data from "../models/data.js";
import Device from "../models/device.js";
import Notification from "../models/notification.js";
import AlarmRule from "../models/emqx_alarm_rule.js";
import Template from "../models/template.js";
import EmqxAuthRule from "../models/emqx_auth.js";

let client;

const response = {
  status: false,
  message: "",
  data: [],
};

router.post("/saver-webhook", async (req, res) => {
  try {
    const token = req.headers.token;
    if (token !== "123456789") {
      response.message = "Invalid token";
      res.status(400).json(response);
      return;
    }
    const data = req.body;

    const splittedTopic = data.topic.split("/");
    const dId = splittedTopic[1];
    const variable = splittedTopic[2];
    let result = await Device.find({ dId: dId, userId: data.userId });
    if (result.length === 1) {
      Data.create({
        userId: data.userId,
        dId: dId,
        variable: variable,
        value: data.payload.value,
        time: Date.now(),
      });
    }
    response.status = true;
    response.message = "Data created";
    res.json(response);
  } catch (error) {
    response.message = "Error creating data";
    res.status(500).json(response);
    console.log("error".red, error);
  }
});
router.post("/alarm-webhook", async (req, res) => {
  try {
    const token = req.headers.token;
    if (token != "123456789") {
      response.message = "Invalid token";
      res.status(400).json(response);
      return;
    }

    const incomingAlarm = req.body;
    updateAlarmCounter(incomingAlarm.emqxRuleId);
    const lastNotif = await Notification.find({
      dId: incomingAlarm.dId,
      emqxRuleId: incomingAlarm.emqxRuleId,
    })
      .sort({ time: -1 })
      .limit(1);

    if (lastNotif == 0) {
      console.log("FIRST TIME ALARM");
      saveNotifToMongo(incomingAlarm);
      sendMqttNotif(incomingAlarm);
    } else {
      const lastNotifToNowMins = (Date.now() - lastNotif[0].time) / 1000 / 60;
      if (lastNotifToNowMins > incomingAlarm.triggerTime) {
        console.log("TRIGGERED");
        saveNotifToMongo(incomingAlarm);
        sendMqttNotif(incomingAlarm);
      }
    }

    response.status = true;
    response.message = "Data created";
    res.json(response);
  } catch (error) {
    response.message = "Error creating data";
    res.status(500).json(response);
    console.log("error".red, error);
  }
});
//GET NOTIFICATIONS
router.get("/notifications", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await getNotifications(userId);

    response.status = true;
    response.message = "All Notifications";
    response.data = notifications;

    res.json(response);
  } catch (error) {
    console.log("ERROR GETTING NOTIFICATIONS");
    console.log(error);

    response.status = false;
    response.message = "Error getting notifications";
    return res.status(500).json(response);
  }
});

//UPDATE NOTIFICATION (readed status)
router.put("/notifications", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const notificationId = req.body.notifId;

    await Notification.updateOne(
      { userId: userId, _id: notificationId },
      { readed: true }
    );
    response.status = true;
    response.message = "Notification updated";
    res.json(response);
  } catch (error) {
    console.log("ERROR UPDATING NOTIFICATION STATUS");
    console.log(error);

    response.status = false;
    response.message = "Error updating notification status";
    return res.status(500).json(response);
  }
});
//DEVICE CREDENTIALS WEBHOOK
router.post("/getdevicecredentials", async (req, res) => {
  try {
  const dId = req.body.dId;
  const password = req.body.password;
  const device = await Device.findOne({ dId: dId });
  if (password != device.password) {
    return res.status(401).json();
  }
  const userId = device.userId;
  let credentials = await getDeviceMqttCredentials(dId, userId);
  let template = await Template.findOne({ _id: device.templateId });
  console.log(credentials);
  var variables = [];

  template.widgets.forEach(widget => {

    let v = (({variable, variableFullName, variableType, variableSendFreq }) => ({
      variable,
      variableFullName,
      variableType,
      variableSendFreq
    }))(widget);

    variables.push(v);
  });

  const toSend = {
    username: credentials.username,
    password: credentials.password,
    topic: userId + "/" + dId + "/",
    variables: variables
  };
  res.json(toSend);
  setTimeout(() => {
    getDeviceMqttCredentials(dId, userId);
    console.log("Device Credentials Updated");
  }, 20000);

  } catch (error) {
    console.log("ERROR GETTING DEVICE CREDENTIALS");
    console.log(error);
    response.status = false;
    response.message = "Error getting device credentials";
    return res.status(500).json(response);
  }
});

//-----------------------------------------------------------
//------------------functions-------------------------------
//-----------------------------------------------------------

//guardar la notificacion en mongo
function saveNotifToMongo(incomingAlarm) {
  try {
    let newNotif = incomingAlarm;
    newNotif.time = Date.now();
    newNotif.readed = false;
    Notification.create(newNotif);
  } catch (error) {
    console.log(error);
    return false;
  }
}
//actualizar el contador de alarmas
async function updateAlarmCounter(emqxRuleId) {
  try {
    await AlarmRule.updateOne(
      { emqxRuleId: emqxRuleId },
      { $inc: { counter: 1 } }
    );
  } catch (error) {
    console.log(error);
    return false;
  }
}
//iniciar el cliente mqtt
function startMqttClient() {
  const options = {
    port: 1883,
    host: "localhost",
    clientId:
      "webhook_superuser" + Math.round(Math.random() * (0 - 10000) * -1),
    username: "superuser",
    password: "superuser",
    keepalive: 60,
    reconnectPeriod: 5000,
    protocolId: "MQIsdp",
    protocolVersion: 3,
    clean: true,
    encoding: "utf8"
  };

  client = mqtt.connect("mqtt://" + "localhost", options);

  client.on("connect", function() {
    console.log("MQTT CONNECTION -> SUCCESS;".green);
    console.log("\n");
  });

  client.on("reconnect", error => {
    console.log("RECONNECTING MQTT");
    console.log(error);
  });

  client.on("error", error => {
    console.log("MQTT CONNECIONT FAIL -> ");
    console.log(error);
  });
}
// enviar la notificacion por mqtt
function sendMqttNotif(notif) {
  console.log("notif".green, notif);
  const topic = notif.userId + "/dummy-did/dummy-var/notif";
  const msg =
    "The rule notification: when the " +
    notif.variableFullName +
    " is " +
    notif.condition +
    " than " +
    notif.value
    + " has been broken ";
  client.publish(topic, msg);
}

//traer todas las notificaciones no leidas
async function getNotifications(userId) {
  try {
    const res = await Notification.find({ userId: userId, readed: false });
    return res;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getDeviceMqttCredentials(dId, userId) {
  try {
    let rule = await EmqxAuthRule.find({
      type: "device",
      userId: userId,
      dId: dId
    });

    if (rule.length == 0) {
      const newRule = {
        userId: userId,
        dId: dId,
        username: makeid(10),
        password: makeid(10),
        publish: [userId + "/" + dId + "/+/sdata"],
        subscribe: [userId + "/" + dId + "/+/actdata"],
        type: "device",
        time: Date.now(),
        updatedTime: Date.now()
      };

      const result = await EmqxAuthRule.create(newRule);

      const toReturn = {
        username: result.username,
        password: result.password
      };

      return toReturn;
    }

    const newUserName = makeid(10);
    const newPassword = makeid(10);

    const result = await EmqxAuthRule.updateOne(
      { type: "device", dId: dId },
      {
        $set: {
          username: newUserName,
          password: newPassword,
          updatedTime: Date.now()
        }
      }
    );

    // update response example
    //{ n: 1, nModified: 1, ok: 1 }

    if (result.n == 1 && result.ok == 1) {
      return {
        username: newUserName,
        password: newPassword
      };
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

setTimeout(() => {
  startMqttClient();
}, 3000);

module.exports = router;
