const express = require("express");
const axios = require("axios");
const app = express();
const fs = require("fs");
const https = require("https");
const bodyParser = require("body-parser");

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/send", (req, res) => {
  console.log("Данные, которые принял сервер приложения: ", req.body);

  res.json(req.body);
});

app.post("/submit", (req, res) => {
  console.log("Отправленные данные: ", req.body);

  const options = {
    method: "POST",
    url: "http://localhost:8080/https://localhost:3000/send",
    data: req.body,
  };

  axios(options)
    .then((response) => {
      console.log("Данные полученые в ответ от сервера: ", response.data);
      return response.data;
    })
    .catch((error) => {
      console.log("Ошибка запроса: ", error);
    });

  res.redirect("/");
});

https
  .createServer(
    {
      cert: fs.readFileSync("cert.pem"),
      key: fs.readFileSync("key.pem"),
    },
    app
  )
  .listen(3000, () => console.log("Приложение запущенно на порту 3000"));
