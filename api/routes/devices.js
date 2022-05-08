const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/authentication');
//models
import Device from '../models/device';

// response
const response = {
  status: false,
  message: "",
  data: [],
};

router.get('/device',checkAuth ,async (req, res) => {
  try {
    const userId=req.user._id;
    const devices = await Device.find({
      userId: userId
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
    const device = await Device.create(newDevice);
    selectDevice(userId,newDevice.dId)
    response.status = true;
    response.message = "Device created";
    response.data = device;
    res.json(response);
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
router.delete('/device',checkAuth, async (req, res) => {
  try {
    const userId=req.user._id;
    const {dId} = req.query;
    const result=await Device.deleteOne({
      dId: dId,
      userId: userId
    });
    response.status = true;
    response.message = "Device deleted";
    response.data = result;
    res.json(response);
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

module.exports = router;
