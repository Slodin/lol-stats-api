let Helpers = require('./methods/helpers.js');

const {Kayn, REGIONS, BasicJSCache} = require('kayn');
const basicJSCache = new BasicJSCache();
const kayn = Kayn(process.env.RIOT_API_KEY)({
    region: REGIONS.NORTH_AMERICA,
    locale: 'en_US',
    debugOptions: {
        isEnabled: true,
        showKey: false,
    },
    requestOptions: {
        shouldRetry: true,
        numberOfRetriesBeforeAbort: 3,
        delayBeforeRetry: 1000,
        burst: true,
        shouldExitOn403: false,
    },
    cacheOptions: {
        cache: basicJSCache,
        timeToLives: {
            useDefault: true,
            byGroup: {
              DDRAGON: 1000 * 60 * 60 * 24 * 1
            },
            byMethod: {},
        },
    },
});

exports.getPlayerStatsFormated = async(req, res)=>{
  let name = req.params.name;
  let start = req.params.start || 0;
  let end = req.params.end || 5;

  try{
    const realm = await getRealmVersion();
    let summoner = await kayn.Summoner.by.name(name);
    let matchlist = await kayn.Matchlist.by.accountID(summoner.accountId).query({startIndex: start, endIndex: end});
    let matchResult = await getAllMatches(matchlist.matches, summoner.accountId);
    let response = {
      summonername: summoner.name,
      summonerlevel: summoner.summonerLevel,
      matches: matchResult
    }
    res.json(response);
  }catch(err){
    res.json({error: {message: "an error has occured", body: err}});
  }
}

async function getRealmVersion(){
  const {n: realm} = await kayn.DDragon.Realm.list();
  return realm;
}

async function getAllMatches(matchlist, accountId){
  let singleMatch = {};
  let matchDetails = [];
  for(const match of matchlist){
    singleMatch = await getSingleMatch(match, accountId);
    matchDetails.push(singleMatch);
  }
  return matchDetails;
}

async function getSingleMatch(matchRef, accountId){
  let match = await kayn.Match.get(matchRef.gameId);
  let participantIdentity = Helpers.findParticipant(match, accountId);
  let player = participantIdentity.player;
  let playerParticipant = Helpers.findMatchByParticipantId(match, participantIdentity.participantId);
  let playerStats = playerParticipant.stats;
  if(playerParticipant.hasOwnProperty('runes')){
    //Legacy runes
    return;
  }
  //Get data from Ddragon and only return them in wanted json format
  let champion = await getChampionData(playerParticipant.championId)
  let spells = await getSpellData([playerParticipant.spell1Id, playerParticipant.spell2Id]);
  let runes = await getRuneData([playerStats.perkPrimaryStyle, playerStats.perk0, playerStats.perk1, playerStats.perk2, playerStats.perk3],
                                [playerStats.perkSubStyle, playerStats.perk4, playerStats.perk5]);
  let items = await getItemData([playerStats.item0, playerStats.item1, playerStats.item2, playerStats.item3, playerStats.item4, playerStats.item5, playerStats.item6]);
  let response = {
    timestamp: matchRef.timestamp,
    outcome: playerStats.win,
    gameduration: match.gameDuration,
    summonerspells: spells,
    summonerrunes: runes,
    championid: champion.id,
    championname: champion.name,
    championlevel: playerStats.champLevel,
    kills: playerStats.kills,
    deaths: playerStats.deaths,
    assists: playerStats.assists,
    kda: (playerStats !== 0) ? (playerStats.kills + playerStats.assists)/playerStats.deaths: -1,
    items: items,
    totalcreepscore: playerStats.totalMinionsKilled,
    creepscorepermin: (match.gameDuration !== 0) ? playerStats.totalMinionsKilled / match.gameDuration * 60: -1
  }

  return response;
}

async function getChampionData(championId){
  let championlist = await kayn.DDragon.Champion.list();
  return Helpers.findDeepKey(championlist.data, championId);
}

async function getSpellData(spellIds=[]) {
  let spelllist = await kayn.DDragon.SummonerSpell.list();
  let spells = [];

  spellIds.forEach(spellId=>{
    let spell = Helpers.findDeepKey(spelllist.data, spellId);
    spells.push({id: spellId, name: spell.name, image: {full: spell.image.full}})
  });

  return spells;
}

async function getRuneData(primaryArray, secondaryArray) {
  //version sould not be hard code in prodcution
  let runelist = await kayn.DDragon.RunesReforged.list().version('8.23.1');
  let primaryRunes = Helpers.findRunes(runelist, primaryArray);
  let secondaryRunes = Helpers.findRunes(runelist, secondaryArray);
  return {primary: primaryRunes, secondary: secondaryRunes};
}

async function getItemData(itemArray=[]) {
  let itemlist = await kayn.DDragon.Item.list();
  let itemResult = [];
  let foundItem = {};
  itemArray.forEach(itemId=>{
    foundItem = itemlist["data"][itemId];
    if(foundItem)
      itemResult.push({id: itemId, name: foundItem.name});
  });
  return itemResult;
}
