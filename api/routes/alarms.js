const express = require("express");
const router = express.Router();
const axios = require("axios");
const { checkAuth } = require("../middlewares/authentication.js");
const colors = require("colors");
import AlarmRule from "../models/emqx_alarm_rule.js";

const auth = {
  auth: {
    username: "admin",
    password: "angel12343",
  },
};

// response
const response = {
  status: false,
  message: "",
  data: [],
};

//******************
//**** A P I *******
//******************

//CREATE ALARM-RULE
router.post("/alarm-rule", checkAuth, async (req, res) => {
  try {
    let newRule = req.body.newRule;
    newRule.userId = req.user._id;

    let r = await createAlarmRule(newRule);

    if (r) {
      response.status = true;
      response.message = "Alarm rule created";
      return res.json(response);
    } else {
      response.message = "Error creating alarm rule";

      return res.status(500).json(response);
    }
  } catch (error) {
    console.log(error);
    response.message = "Error creating alarm rule";
    return res.status(500).json(response);
  }
});
//UPDATE ALARM-RULE STATUS
router.put("/alarm-rule", checkAuth, async (req, res) => {
  let rule = req.body.rule;
  console.log("--------------------------------------");
  console.log(rule.status);
  console.log("--------------------------------------");
  let r = await updateAlarmRuleStatus(rule.emqxRuleId, rule.status);

  if (r) {
    response.status = true;
    response.message = "Alarm rule updated";

    return res.json(response);
  } else {
    response.message = "Error updating alarm rule";

    return res.status(500).json(response);
  }
});
//DELETE ALARM-RULE
router.delete("/alarm-rule", checkAuth, async (req, res) => {
  let emqxRuleId = req.query.emqxRuleId;

  let r = await deleteAlarmRule(emqxRuleId);

  if (r) {
    response.status = true;
    response.message = "Alarm rule deleted";

    return res.json(response);
  } else {
    response.message = "Error deleting alarm rule";


    return res.status(500).json(response);
  }
});

//---------------------------------------------
//----------------function---------------------
//---------------------------------------------

//CREATE ALARM
async function createAlarmRule(newAlarm) {
  try {
    const url = "http://" + "localhost" + ":8085/api/v4/rules";

    // topicExample = userid/did/temp  //msgExample = {value: 20}
    const topic =
      newAlarm.userId + "/" + newAlarm.dId + "/" + newAlarm.variable + "/sdata";

    const rawsql =
      'SELECT username, topic, payload FROM "' +
      topic +
      '" WHERE payload.value ' +
      newAlarm.condition +
      " " +
      newAlarm.value +
      " AND is_not_null(payload.value)";

    let newRule = {
      rawsql: rawsql,
      actions: [
        {
          name: "data_to_webserver",
          params: {
            $resource: global.alarmResource.id,
            payload_tmpl:
              '{"userId":"' +
              newAlarm.userId +
              '","payload":${payload},"topic":"${topic}"}',
          },
        },
      ],
      description: "ALARM-RULE",
      enabled: newAlarm.status,
    };

    //save rule in emqx - grabamos la regla en emqx
    const res = await axios.post(url, newRule, auth);
    console.log(res.data);
    let emqxRuleId = res.data.data.id;
    if (res.data.data && res.status === 200) {
      //save rule in mongo -- grabamos regla en mongo
      const mongoRule = await AlarmRule.create({
        userId: newAlarm.userId,
        dId: newAlarm.dId,
        emqxRuleId: emqxRuleId,
        status: newAlarm.status,
        variable: newAlarm.variable,
        variableFullName: newAlarm.variableFullName,
        value: newAlarm.value,
        condition: newAlarm.condition,
        triggerTime: newAlarm.triggerTime,
        createTime: Date.now(),
      });
      const url =
        "http://" + "localhost" + ":8085/api/v4/rules/" + mongoRule.emqxRuleId;

      const payload_templ =
        '{"userId":"' +
        newAlarm.userId +
        '","dId":"' +
        newAlarm.dId +
        '","deviceName":"' +
        newAlarm.deviceName +
        '","payload":${payload},"topic":"${topic}","emqxRuleId":"' +
        mongoRule.emqxRuleId +
        '","value":' +
        newAlarm.value +
        ',"condition":"' +
        newAlarm.condition +
        '","variable":"' +
        newAlarm.variable +
        '","variableFullName":"' +
        newAlarm.variableFullName +
        '","triggerTime":' +
        newAlarm.triggerTime +
        "}";

      newRule.actions[0].params.payload_tmpl = payload_templ;

      const res = await axios.put(url, newRule, auth);

      console.log("New Alarm Rule Created...".green);

      return true;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}
//UPDATE ALARM STATUS
async function updateAlarmRuleStatus(emqxRuleId, status) {
  const url = "http://localhost:8085/api/v4/rules/" + emqxRuleId;
  try {
    const newRule = {
      enabled: status,
    };
    const res = await axios.put(url, newRule, auth);
    if (res.data.data && res.status === 200) {
      await AlarmRule.updateOne({ emqxRuleId: emqxRuleId }, { status: status });
      console.log("Saver Rule Status Updated...".green);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }

}
//DELETE ONLY ONE RULE
async function deleteAlarmRule(emqxRuleId) {
  try {
    const url = "http://localhost:8085/api/v4/rules/" + emqxRuleId;

    const emqxRule = await axios.delete(url, auth);

    const deleted = await AlarmRule.deleteOne({ emqxRuleId: emqxRuleId });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = router;
