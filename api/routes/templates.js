const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/authentication');
//models
import Template from '../models/template';

// response
const response = {
  status: false,
  message: "",
  data: [],
};

router.get('/template',checkAuth ,async (req, res) => {
  try {
    const userId=req.user._id;
    const templates = await Template.find({
      userId: userId
    });
    response.status = true;
    response.message = "templates found";
    response.data = templates;
    res.json(response);
  } catch (error) {
    response.message = "Error finding templates";
    res.status(400).json(response);
    console.log("error".red, error);
  } finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});

router.post('/template',checkAuth,async (req, res) => {
  try {
    const userId=req.user._id;
    let newTemplate = req.body.template;
    newTemplate.userId=userId;
    newTemplate.createTime=Date.now();
    const template = await Template.create(newTemplate);
    response.status = true;
    response.message = "template created";
    // response.data = template;
    res.json(response);
  } catch (error) {
    response.message = "Error creating template";
    res.status(500).json(response);
    console.log("error".red, error);
  }finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});

router.delete('/template',checkAuth, async (req, res) => {
  try {
    const userId=req.user._id;
    const templateId = req.query.templateId;
    const result=await Template.deleteOne({
      userId: userId,
      _id: templateId
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

module.exports = router;
