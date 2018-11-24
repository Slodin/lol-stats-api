module.exports = (app) => {
  let RiotApi = require('../controller/riotApiController');

  app.route('/getplayerstats/:name/:start/:end').get(RiotApi.getPlayerStatsFormated);
}
