const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = "ajay karode is a good boy"; //this should be kept safe. we did not have to show to others

// ROUTE1: Create a user using : POST "/api/auth/createuser", No login required
router.post(
  "/createuser", // end point
  [
    body("name", "Enter a Valid Name. Must have Atleast 3 Characters").isLength(
      { min: 3 }
    ),
    body("email", "Enter a Valid Email").isEmail(),
    body(
      "password",
      "Enter a Valid Password. Must Have Atleast 8 Characters"
    ).isLength({ min: 8 }),
  ],
  async (req, res) => {
    // if there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // check whether ther user with this email exists already or not
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a User with this Email already exist!" });
      }
      const salt = await bcrypt.genSalt(10);
      // secPass = bcrypt.hash(password,salt)
      secPass = await bcrypt.hash(req.body.password, salt);
      // Create a new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      //   .then(user => res.json(user))
      //   .catch(err=> {console.log(err)
      // res.json({error: "Please enter a valid Unique Email",message: err.message})});
      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, JWT_SECRET);

      console.log(authtoken);
      // res.json(user);

      res.json({ authtoken });
      //catch error
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error"); // if error occured i will send status code
    }
  }
);

// ROUTE2 : authenticate a user using : POST "/api/auth/login", No login required
router.post(
  "/login", // end point
  [
    body("email", "Enter a Valid Email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    // if there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Plese try to login with correct credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, JWT_SECRET);

      res.json({ authtoken });
      console.log("user authenticated")
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error"); // if error occured i will send status code
    }
  }
);

// ROUTE3 : get logged in user details : POST "/api/auth/getuser", Login required
router.post("/getuser",fetchuser, async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user)
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error"); // if error occured i will send status code
  }
});







// ROUTE4 : Delete an existing note using : DELETE "/api/auth/deleteuser", Login required

router.delete("/deleteuser/:id", fetchuser, async (req, res) => {
    try {
      //find the note to be deleted and delete it
      let person = await User.findById(req.params.id);
      if (!person) {
        return res.status(404).send("Not Found");
      }
  
    //   Allow deletion only if user owns this note
      if (person.user.toString() != req.user.id) {
        return res.status(404).send("Not Allowed");
      }
  
      person = await User.findByIdAndDelete(req.params.id);
      res.json({ Success: "User has been deleted", person: person });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  });
  

module.exports = router;
