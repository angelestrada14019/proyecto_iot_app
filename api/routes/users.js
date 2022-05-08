const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// response
const response = {
  status: false,
  message: "",
  data: [],
};

//models imports
import User from "../models/user";

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
        { expiresIn: 60*60*24*30 } // 1 month
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

module.exports = router;
