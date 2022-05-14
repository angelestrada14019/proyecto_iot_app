const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/authentication');
const axios = require("axios");
//models
import Device from '../models/device';
import SaverRule from "../models/emqx_saver_rule.js";
import Template from "../models/template.js";
import AlarmRule from '../models/emqx_alarm_rule.js';
import EmqxAuthRule from "../models/emqx_auth.js";
// response
const response = {
  status: false,
  message: "",
  data: [],
};

//******************
//**** A P I *******
//******************

const auth = {
  auth: {
    username: "admin",
    password: "angel12343"
  }
};

router.get('/device',checkAuth ,async (req, res) => {
  try {
    const userId=req.user._id;
    let devices = await Device.find({
      userId: userId
    });
    // //mongoose array to js array
     devices = JSON.parse(JSON.stringify(devices));

    //get saver rules
    const saverRules = await getSaverRules(userId);

    // //get templates
    const templates = await getTemplates(userId);
    //get alarm rules
    const alarmRules = await getAlarmRules(userId);
    //saver rules to -> devices
    devices.forEach((device, index) => {
      devices[index].saverRule = saverRules.filter(
        saverRule => saverRule.dId == device.dId
      )[0];
      devices[index].template = templates.filter(
        template => template._id == device.templateId
      )[0];
      devices[index].alarmRules = alarmRules.filter(
        alarmRule => alarmRule.dId == device.dId
      );
    });
    response.status = true;
    response.message = "Devices found";
    response.data = devices;
    res.json(response);
  } catch (error) {
    response.message = "Error finding devices";
    res.status(400).json(response);
    console.log("error".red, error);
  } finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});

router.post('/device',checkAuth,async (req, res) => {
  try {
    let {newDevice} = req.body;
    const userId=req.user._id;
    newDevice.userId=userId;
    newDevice.createTime=Date.now();
    newDevice.password = makeid(10);
    const saverRuleCreated = await createSaverRule(userId, newDevice.dId, true);
    if (saverRuleCreated) {
    const device = await Device.create(newDevice);
    await selectDevice(userId,newDevice.dId)
    response.status = true;
    response.message = "Device created";
    response.data = device;
    res.json(response);
    } else {
      response.message = "Error creating device";
      res.status(500).json(response);
    }
  } catch (error) {
    response.message = "Error creating device";
    res.status(500).json(response);
    console.log("error".red, error);
  }finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});
router.put('/device',checkAuth,async (req, res) => {
  try {
    const {dId} = req.body;
    const userId=req.user._id;
    const result = await selectDevice(userId,dId);
    if(result){
      response.status = true;
      response.message = "Device selected";
      response.data = result;
      res.json(response);
    }else{
      response.status = false;
      response.message = "Error selecting device";
      response.data = result;
      res.status(500).json(response);
    }
  } catch (error) {

  }finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});
//SAVER-RULE STATUS UPDATER
router.put("/saver-rule", checkAuth, async (req, res) => {
  try {
    const rule = req.body.rule;

    console.log(rule);

    await updateSaverRuleStatus(rule.emqxRuleId, rule.status);

    response.status = true;
    response.message = "Saver Rule status updated";
    res.json(response);
  } catch (error) {
    response.status = false;
    response.message = "Error updating saver rule status";
    res.status(500).json(response);
    console.log(error);
  }
});
router.delete('/device',checkAuth, async (req, res) => {
  try {
    const userId=req.user._id;
    const {dId} = req.query;
    //deleting saver rule.
    const deleting =await deleteSaverRule(dId);

    if(deleting){
      // delete all alarms
      await deleteAllAlarmRules(dId);
      //delete devie credentials
      await deleteMqttDeviceCredentials(dId);
      //deleting device
    const result=await Device.deleteOne({
      dId: dId,
      userId: userId
    });
    const devices = await Device.find({
      userId: userId
    });
    if(devices.length>=1){
      //any selected
      let found = false;
      devices.forEach(device => {
        if(device.selected){
          found = true;
        }
      });
      //no selected need to select first
      if(!found){
        await Device.updateMany({userId: userId},{selected: false});
        await Device.updateOne({userId: userId,dId: devices[0].dId},{selected: true});

      }
    }

    response.status = true;
    response.message = "Device deleted";
    response.data = result;
    res.json(response);
    }else{
      response.status = false;
      response.message = "Error deleting device";
      response.data = result;
      res.status(500).json(response);
    }
  } catch (error) {
    response.message = "Error deleting device";
    res.status(500).json(response);
    console.log("error".red, error);
  }finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});

/*
-------------------------------------------
------------- FUNCTIONS -------------------
-------------------------------------------
*/
//get alarms rules
async function getAlarmRules(userId) {

  try {
      const rules = await AlarmRule.find({ userId: userId });
      return rules;
  } catch (error) {
      return "error";
  }

}

//delet all alarmas
async function deleteAllAlarmRules(userId, dId) {
  try {
    const rules = await AlarmRule.find({ userId: userId, dId: dId });

    if (rules.length > 0) {
      asyncForEach(rules, async rule => {
        const url = "http://localhost:8085/api/v4/rules/" + rule.emqxRuleId;
        const res = await axios.delete(url, auth);
      });

      await AlarmRule.deleteMany({ userId: userId, dId: dId });
    }

    return true;
  } catch (error) {
    console.log(error);
    return "error";
  }
}

// We can solve this by creating our own asyncForEach() method:
// thanks to Sebastien Chopin - Nuxt Creator :)
// https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

//delete ALL emqx device  auth rules
async function deleteMqttDeviceCredentials(dId) {
  try {
    await EmqxAuthRule.deleteMany({ dId: dId, type: "device" });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

const selectDevice = async  (userId,dId) => {
  try {
  const result=await Device.updateMany({
    userId: userId,
  },{
    selected: false
  });
  const result2=await Device.updateOne({
    dId: dId,
    userId: userId
  },{
    selected: true
  });
  return true;
  } catch (error) {
    console.log("error".red, error);
    return false;
  }
}


/*
 SAVER RULES FUNCTIONS
*/
//get templates
async function getTemplates(userId) {
  try {
    const templates = await Template.find({ userId: userId });
    return templates;
  } catch (error) {
    return false;
  }
}

//get saver rules
async function getSaverRules(userId) {
  try {
    const rules = await SaverRule.find({ userId: userId });
    console.log("Saver Rules Found...".green);
    console.log(rules);
    return rules;
  } catch (error) {
    return false;
  }
}

//create saver rule
async function createSaverRule(userId, dId, status) {
  try {
    const url = "http://"+ "localhost" +":8085/api/v4/rules";

    const topic = userId + "/" + dId + "/+/sdata";

    const rawsql =
      'SELECT topic, payload FROM "' + topic + '" WHERE payload.save = 1';


    var newRule = {
      rawsql: rawsql,
      actions: [
        {
          name: "data_to_webserver",
          params: {
            $resource: global.saverResource.id,
            payload_tmpl: '{"userId":"' + userId + '","payload":${payload},"topic":"${topic}"}'
          }
        }
      ],
      description: "SAVER-RULE",
      enabled: status
    };

    //save rule in emqx - grabamos la regla en emqx
    const res = await axios.post(url, newRule, auth);

    console.log(res.data);
    if (res.status === 200 && res.data.data) {
      await SaverRule.create({
        userId: userId,
        dId: dId,
        emqxRuleId: res.data.data.id,
        status: status
      });
      console.log("saver rule create".green);
      return true;
    } else {
      console.log("error created saver rule data".red);
      return false;
    }
  } catch (error) {
    console.log("Error creating saver rule exception".red, error);
    return false;
  }
}

//update saver rule
async function updateSaverRuleStatus(emqxRuleId, status) {
  try {
    const url = "http://"+"localhost"+":8085/api/v4/rules/" + emqxRuleId;

    const newRule = {
      enabled: status
    };

    const res = await axios.put(url, newRule, auth);
    console.log(res.data);
    if (res.status === 200 && res.data.data) {
      await SaverRule.updateOne({ emqxRuleId: emqxRuleId }, { status: status });
      console.log("Saver Rule Status Updated...".green);
      return true;
    } else {
        console.log("Error updating saver rule status no data".red);
      return false;
    }
  } catch (error) {
    console.log("Error updating saver rule status exception".red);
    console.log(error);
    return false;
  }
}

//delete saver rule
async function deleteSaverRule(dId) {
  try {
    const mongoRule = await SaverRule.findOne({ dId: dId });

    const url = "http://"+"localhost"+":8085/api/v4/rules/" + mongoRule.emqxRuleId;

    const emqxRule = await axios.delete(url, auth);

    const deleted = await SaverRule.deleteOne({ dId: dId });
    console.log("Saver Rule Deleted...".green);
    return true;
  } catch (error) {
    console.log("Error deleting saver rule".red);
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

module.exports = router;
