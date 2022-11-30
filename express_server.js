const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  const possibleChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let RandomString = '';
  for (let x = 0; x < 6; x++) {
    RandomString += possibleChars[Math.floor(Math.random() * 62)];
  }
  return RandomString;
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  if(!req.cookies['username']) {
    res.redirect(`/urls`);
  }
  res.redirect(`/login`);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  console.log(req.cookies['username']);
  const templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies['username'] }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies['username'] }
  res.render("urls_register", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.render(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls/`);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/`);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls`);
});

app.get("/urls/:id", (req, res) => {
  const long = urlDatabase[req.params.id];
  const templateVars = { id: req.params.id, longURL: long, username: req.cookies['username'] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});