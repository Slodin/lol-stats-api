let express = require('express'),
      app = express(),
      env = require('dotenv').config(),
      port = process.env.PORT,
      bodyParser = require('body-parser'),
      routes = require('./api/router/apiRouter.js');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use((req, res, next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
})

routes(app);
app.listen(port)
console.log('Riot REST is up @' + port);
