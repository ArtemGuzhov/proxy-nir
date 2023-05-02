const http = require("http");
const https = require("https");
const url = require("url");

const PORT = 8080;
const agent = new https.Agent({
  rejectUnauthorized: false,
});

http.createServer(onRequest).listen(PORT);
console.log(`Прокси-сервер запущен на порту ${PORT}`);

function onRequest(clientReq, clientRes) {
  clientReq.url = clientReq.url.slice(1, clientReq.url.length);
  console.log("Запрос получен " + clientReq.url);

  if (clientReq.method === "POST") {
    let body = [];

    clientReq
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", () => {
        body = Buffer.concat(body).toString();
        console.log("Тело POST-запроса:", JSON.parse(body));

        const bodyEntries = Object.entries(JSON.parse(body));
        const newBodyEntries = bodyEntries.map((item, index) => [
          item[0],
          item[1] + (index + 1),
        ]);

        const newBody = JSON.stringify(Object.fromEntries(newBodyEntries));
        console.log("Обновленое тело POST-запроса: ", JSON.parse(newBody));

        const newHeaders = Object.assign({}, clientReq.headers, {
          "Content-Length": Buffer.byteLength(newBody),
        });

        const requestOptions = url.parse(clientReq.url);
        requestOptions.headers = newHeaders;
        requestOptions.method = clientReq.method;
        requestOptions.agent = agent;

        const httpModule = requestOptions.protocol === "https:" ? https : http;

        const proxy = httpModule.request(requestOptions, function (res) {
          clientRes.writeHead(res.statusCode, res.headers);
          res.pipe(clientRes, {
            end: true,
          });
        });

        proxy.on("error", function (err) {
          console.error(err);
          clientRes.end();
        });

        // Отправляем новое тело запроса на целевой сервер
        proxy.write(newBody);
        proxy.end();
      });
  } else {
    // Извлекаем данные из запроса клиента
    const requestOptions = url.parse(clientReq.url);
    requestOptions.headers = clientReq.headers;
    requestOptions.method = clientReq.method;
    requestOptions.agent = agent;

    // Определяем, какой протокол использовать: http или https
    const httpModule = requestOptions.protocol === "https:" ? https : http;

    // Создаем запрос к целевому серверу
    const proxy = httpModule.request(requestOptions, function (res) {
      clientRes.writeHead(res.statusCode, res.headers);
      res.pipe(clientRes, {
        end: true,
      });
    });

    // Отправляем тело запроса от клиента в запрос на целевой сервер
    clientReq.pipe(proxy, {
      end: true,
    });

    // Обрабатываем ошибки
    proxy.on("error", function (err) {
      console.error(err);
      clientRes.end();
    });
  }
}
