exports.findParticipant = (match, accountId)=>{
  return match.participantIdentities.find(participant=>{
    return participant.player.accountId === accountId;
  })
}

exports.findMatchByParticipantId = (match, participantId)=>{
  return match.participants.find(participant=>{
    return participant.participantId === participantId;
  })
}

exports.findDeepKey = (object, key)=>{
  for(const item in object){
    if(object.hasOwnProperty(item)){
      if(object[item].hasOwnProperty("key")){
        if(object[item]["key"] == key){
          return object[item];
        }
      }
    }
  }
  return -1;
}

exports.findRunes = (object, keys)=>{
  let runeResult = [];
  let foundRune;
  let majorRune = object.find(rune=> rune.id == keys[0]);
  if(majorRune){
    runeResult.push({id: keys[0], name: majorRune.name, icon: majorRune.icon})
    majorRune.slots.forEach(slot=>{
      for(let i = 1; i < keys.length; i++){
        foundRune = slot.runes.find(rune=> rune.id == keys[i]);
        if(foundRune){
          runeResult.push({id: keys[i], name: foundRune.name, icon: foundRune.icon});
          break;
        }
      }
    });
  }
  return runeResult;
}
