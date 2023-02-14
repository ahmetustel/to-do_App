const User = require("../models/model");
const Token = require("../models/token");
const Post = require("../models/post");
const brcpt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generateToken = require('./generateToken');

const getUser = async (req, res) => {
  try {
    const searhedUser = await User.findOne({ username: req.params.name });
    console.log(searhedUser);
    res.status(200).json(searhedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const createUser = async (req, res) => {
  try {
    const salt = await brcpt.genSalt();
    const hashedPassword = await brcpt.hash(req.body.password, salt);

    console.log("username: ", req.body.username);
    console.log("password: ", req.body.password);
    console.log("hashedPasword: ", hashedPassword);

    /*models klasöründen "user" objesi oluşturup, oluşturulan objeye post methodu ile iletilen body değişkenleri atanır. Bunun için; */
    const newUser = await new User({ username: req.body.username, password: req.body.password, hashedpassword: hashedPassword }); // user object oluşturulur
    const createdUser = await newUser.save(); // oluşturulan object, veritabanına KAYDEDİLİR.
    res.status(201).json({ status: true, message: createdUser }); // Oluşturulan user ekrana status kodu ile gönderilir.

  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteUser = async (req, res) => {
  try {
    const searhedUser = await User.findOne({ name: req.params.name });
    console.log(searhedUser.username, ' is deleted');
    const deletedUser = await User.deleteOne(searhedUser);
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(500).json(error);
  }
};

const login = async (req, res) => {

  const users = await User.find(); // tüm userlar "users" değişkenine atanır.
  const loginingUser = users.find(user => user.username === req.body.username);

  if (loginingUser == null) {

    return res.status(400).send('cannot find user');
  }
  try {
    if (await brcpt.compare(req.body.password, loginingUser.hashedpassword)) {

      const { username, password } = req.body; // login esnasında kullanılan username ve şifre değişkene atanır
      const payLoad = { username, password }; // bu username ve şifre payload olarak ayarlanır

      const accessToken = generateToken.generateAccessToken(payLoad);
      const refreshToken = generateToken.generateRefreshToken(payLoad);

      const newToken = await new Token({ accessToken: accessToken, refreshToken: refreshToken }).save();

      console.log('accessToken: ', newToken.accessToken, ' is Successfully created');
      console.log('refreshToken: ', newToken.refreshToken, ' is Successfully created.');

      res.status(201).json({
        status: true,
        username,
        password,
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken
      });

    } else {
      console.log('Not Allowed');
      res.send('Not Allowed');
    }
  } catch (error) {
    res.status(500).send();
  }
};

const refreshToken = async (req, res) => {
  console.log(req.body.token);
  const tokens = await Token.find().lean(); // Tüm token kayırları veritabanından çekilir.
  const searchedToken = tokens.find(token => token.refreshToken === req.body.refreshToken); // Çekilen kayıtlar arasında bizim tokenimiz var ise DOCUMENT OLARAK alınır.
  console.log(searchedToken);

  // console.log(refreshToken); // DOKUMENT olarak alınan token ın Ekran Çıktısı. Document olduğu için token'a token.token ile ulaşılır.
  if (searchedToken == null) return res.sendStatus(401);
  if (!searchedToken) return res.sendStatus(403);
  jwt.verify(searchedToken.refreshToken, process.env.refresh_key, (err, payLoad) => {
    if (err) return res.sendStatus(403);
    //const accessToken = generateToken.generateAccessToken(payLoad);
    //res.json({accessToken: accessToken});
    console.log(payLoad);
    res.status(201).json(payLoad);
  }
  );
}

const logout = async (req, res) => {
  const tokens = await Token.find().lean(); // Tüm token kayırları veritabanından çekilir.
  const searchedToken = tokens.find(token => token.refreshToken === req.body.token);

  if (searchedToken == null) return res.sendStatus(403);
  if (searchedToken.refreshToken == req.body.token) {
    const deletedToken = await Token.deleteOne(searchedToken);
    console.log(deletedToken, ' is deleted');
  } return res.send('Logged out - Çıkış yapıldı');

}

const todo = async (req, res) => {
  try {
    
    // ADD ITEM butonu 
    if (req.body.title) {
      const newPost = await new Post({ username: req.body.username, title: req.body.title }); // post object oluşturulur
      console.log(newPost);
      const createdPost = await newPost.save(); // oluşturulan post object veritabanına kaydedilir.
      const titles = await Post.find().lean();
      req.body.title="";
      return res.render('todo', { todos: titles });
    }

    //DELETE ITEM butonu
    let keys = []; // seçilen checkboxların _id bilgilerinin toplanması için
    let indis = 0; // seçilen checkbox sayısını bulmak için
    for (const iterator in req.body) {
      keys[indis] = iterator;
      indis++;
    }
    //Veritabanından tüm title leri çekeriz
    const titles = await Post.find().lean();
    //Gelen checkbox verilerini tespit edip veritabanı ile karşılaştırdıktan sonra _id'si eşit olanı siler
      for (var index = 0; index < indis; index++) {
        for (var ind = 0; ind < titles.length; ind++) {
          if (titles[ind]._id == keys[index]) {
            const selectedTitle = await Post.findOne({ _id: keys[index] });
            console.log(selectedTitle.title, " is deleted");
            const deletedTitle = await Post.deleteOne(selectedTitle);
          }
        }
      }
      const latestTitles = await Post.find().lean();
      res.render("todo", { todos: latestTitles });

  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

module.exports = {
  getUser,
  createUser,
  deleteUser,
  login,
  refreshToken,
  logout,
  todo
};