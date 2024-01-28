// prueba1234
const express = require("express");
const https = require("https");
const path = require("path");
const fs = require("fs");
const cors = require("cors");


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('public', __dirname + '/public');
app.engine('html', require('ejs').renderFile);

app.use("/api", require("./src/routes/router"));

app.use("/", (req, res, next) => {
res.send("Hola desde el SSL Server");
});


//C:\Users\jesus\OneDrive\Documents\SeguridadInformatica\SSL



const sslServer = https.createServer(
{
key: fs.readFileSync(path.join(path.resolve(), 
"key.pem")),
cert: fs.readFileSync(path.join(path.resolve(), 
"cert.pem")),
},
app
);



sslServer.listen(8000, () => {
console.log("Servidor HTTPS corriendo en el puerto 8000");
});




