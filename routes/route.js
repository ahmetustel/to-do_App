const express = require("express");
const authToken = require("../middleware/authToken");
const {
  createUser,
  deleteUser,
  login,
  getUser,
  refreshToken,
  logout,
  todo
} = require("../controllers/controller");

const router = express.Router();

/* Creating the routes for the user controller. */

router.get("/users/:name",authToken, getUser);

router.post("/createUser", createUser);

router.delete("/users/:name", deleteUser);

router.post("/login",login);

router.post("/token", refreshToken);

router.delete("/logout", logout);

router.get("/todo", todo);

router.post("/todo");

router.delete("/todo");

module.exports = router;