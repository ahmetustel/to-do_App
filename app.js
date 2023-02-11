const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const UserRoutes = require('./routes/route');

require('dotenv').config(); // .env dosyasının heryerden kullaılması için

const app = express();

// set up template engine
app.set('view engine', 'ejs');

//Json file dosyaları için
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// static files
app.use(express.static('public'));

/* This is the root route. It is used to check if the server is running. */
app.get("/", (req, res) => {
    res.status(200).json({ alive: "True" });
  });

/* Telling the server to use the routes in the UserRoutes file. */
app.use("/", UserRoutes);

//listen to port
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, console.log("Server started on port: ", PORT));
    }).catch((err) => {
        console.log(err);
    });