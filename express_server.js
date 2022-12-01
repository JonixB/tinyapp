const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers.js');

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['vSSalErXAFaJ48lWaXa8We']
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aXa8We"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "rBX6qMrhXDU68PWXdhEw",
  },
  "aXa8We": {
    id: "aXa8We",
    email: "user2@example.com",
    password: "dZlyUvUgf1qj2LKnH2PN",
  },
};

const generateRandomString = () => {
  const possibleChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let RandomString = '';
  for (let x = 0; x < 6; x++) {
    RandomString += possibleChars[Math.floor(Math.random() * 62)];
  }
  return RandomString;
};

const urlsForUser = (id) => {
  const filteredURLS = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      filteredURLS[url] = { longURL: urlDatabase[url].longURL };
    }
  }
  return filteredURLS;
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  if(!req.session.user_id) {
    res.redirect(`/urls`);
  }
  res.redirect(`/login`);
});

app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.status(200).send("Please login to view the URLS");
  }
  const templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect(`/login`);
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id === undefined) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  }
  res.redirect(`/urls/`);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === '' || password === '') {
    res.status(400).send("Email or password cannot be empty");
  }

  if (getUserByEmail(email, users) !== null) {
    res.status(400).send("Email is already in use. Please type a different email");
  }

  users[id] = { id: id, email: email, password: hashedPassword };
  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.status(200).send("Only logged in users are allowed to shorten URLs. Please log in to use this feature.");
  }
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.params.id in urlDatabase) {
    if (req.session.user_id === undefined) {
      res.status(200).send("Please log in to view this URL");
    }

    if (req.session.user_id !== urlDatabase[req.params.id].userID) {
      res.status(200).send("You do not have access to this URL");
    }
    const id = req.params.id;
    delete urlDatabase[id];
    res.redirect(`/urls/`);
  }
  res.status(200).send("ID do not exist. Please enter a correct ID");
});

app.post("/urls/:id", (req, res) => {
  if (req.params.id in urlDatabase) {
    if (req.session.user_id === undefined) {
      res.status(200).send("Please log in to view this URL");
    }

    if (req.session.user_id !== urlDatabase[req.params.id].userID) {
      res.status(200).send("You do not have access to this URL");
    }
    const id = req.params.id;
    urlDatabase[id].longURL = req.body.longURL;
    res.redirect(`/urls/`);
  }
  res.status(200).send("ID do not exist. Please enter a correct ID");
});

app.get("/login", (req, res) => {
  if (req.session.user_id === undefined) {
    const templateVars = { user: users[req.session.user_id] };
    res.render(`urls_login`, templateVars);
  }
  res.redirect(`/urls/`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if(getUserByEmail(email, users) === null) {
    res.status(403).send("Incorrect email");
  }

  if (bcrypt.compareSync(password, getUserByEmail(email, users).password) !== true) {
    res.status(403).send("Incorrect password");
  }
  
  req.session.user_id = getUserByEmail(email, users).id;
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/login`);
});

app.get("/urls/:id", (req, res) => {
  if (req.params.id in urlDatabase) {
    if (req.session.user_id === undefined) {
      res.status(200).send("Please log in to view this URL");
    }

    if (req.session.user_id !== urlDatabase[req.params.id].userID) {
      res.status(200).send("You do not have access to this URL");
    }
    const long = urlDatabase[req.params.id].longURL;
    const templateVars = { id: req.params.id, longURL: long, user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  }
  res.status(200).send("ID do not exist. Please enter a correct ID");
});

app.get("/u/:id", (req, res) => {
  if (req.params.id in urlDatabase) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
  res.status(200).send("ID do not exist. Please enter a correct ID");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});