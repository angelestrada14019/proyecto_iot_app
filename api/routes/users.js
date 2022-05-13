const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { checkAuth } = require("../middlewares/authentication.js");

// response
const response = {
  status: false,
  message: "",
  data: [],
};

//models imports
import User from "../models/user";
import EmqxAuthRule from "../models/emqx_auth.js";

//auth
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({
      email: email,
    });
    if (!user) {
      response.message = "Credenciales invalidas";
      return res.status(401).json(response);
    }
    const match = bcrypt.compareSync(password, user.password);
    if (match) {
      user.set("password", undefined, { strict: false });
      const token = jwt.sign(
        {
          user: user,
        },
        "secret-ajea14019",
        { expiresIn: 60 * 60 * 24 * 30 } // 1 month
      );
      response.status = true;
      response.message = "Login correcto";
      response.data = {
        token: token,
        user: user,
      };
      return res.status(200).json(response);
    } else {
      response.message = "Credenciales invalidas";
      return res.status(401).json(response);
    }
  } catch (error) {
  } finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const encryptedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      name: name,
      email: email,
      password: encryptedPassword,
    };
    const user = await User.create(newUser);
    response.status = true;
    response.message = "Usuario creado correctamente";
    res.json(response);
  } catch (error) {
    response.status = false;
    response.message = "Error al crear el usuario";
    res.status(500).json(response);
    console.log("error-register".red, error);
  } finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});

//GET MQTT WEB CREDENTIALS
router.post("/getmqttcredentials", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const credentials = await getWebUserMqttCredentials(userId);
    response.status = true;
    response.message = "Credenciales obtenidas correctamente";
    response.data = credentials;
    res.json(response);
    setTimeout(() => {
    getWebUserMqttCredentials(userId);
    }, 5000);
    return
  } catch (error) {
    response.status = false;
    response.message = "Error al obtener las credenciales";
    response.data = [];
    console.log("error-getmqttcredentials".red, error);
    return res.status(500).json(response);
  }
});

//get mqtt credentials for reconection
router.post("/getmqttcredentialsforreconnection", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const credentials = await getWebUserMqttCredentialsForReconnection(userId);
    response.status = true;
    response.message = "Credenciales obtenidas correctamente";
    response.data = credentials;
    res.json(response);
    setTimeout(() => {
      getWebUserMqttCredentials(userId);
    }, 15000);
  } catch (error) {
    response.status = false;
    response.message = "Error al obtener las credenciales";
    response.data = [];
    console.log("error-getmqttcredentialsforreconnection".red, error);
    return res.status(500).json(response);

  }
});

//CRUD
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    response.status = true;
    response.message = "Users found";
    response.data = users;
    res.json(response);
  } catch (error) {
    response.message = "Error finding users";
    res.status(400).json(response);
    console.log("error".red, error);
  } finally {
    response.status = false;
    response.message = "";
    response.data = [];
  }
});

//------------------------------------------------------
//-----------------functions----------------------------
//------------------------------------------------------

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
// mqtt credential types: "user", "device", "superuser"
async function getWebUserMqttCredentials(userId) {
  try {
    let rule = await EmqxAuthRule.find({ type: "user", userId: userId });

    if (rule.length == 0) {
      const newRule = {
        userId: userId,
        username: makeid(10),
        password: makeid(10),
        publish: [userId + "/#"],
        subscribe: [userId + "/#"],
        type: "user",
        time: Date.now(),
        updatedTime: Date.now(),
      };

      const result = await EmqxAuthRule.create(newRule);

      const toReturn = {
        username: result.username,
        password: result.password,
      };

      return toReturn;
    }

    const newUserName = makeid(10);
    const newPassword = makeid(10);

    const result = await EmqxAuthRule.updateOne(
      { type: "user", userId: userId },
      {
        $set: {
          username: newUserName,
          password: newPassword,
          updatedTime: Date.now(),
        },
      }
    );

    // update response example true
    //{ n: 1, nModified: 1, ok: 1 }

    if (result.n == 1 && result.ok == 1) {
      return {
        username: newUserName,
        password: newPassword,
      };
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}
async function getWebUserMqttCredentialsForReconnection(userId) {
  try {
    let rule = await EmqxAuthRule.find({ type: "user", userId: userId });
    console.log(rule);
    if (rule.length == 1) {
      const toReturn = {
        username: rule[0].username,
        password: rule[0].password,
      }
      return toReturn;
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = router;
