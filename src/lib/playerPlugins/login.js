var Entity=require("prismarine-entity");
var Vec3=require("vec3");

module.exports=inject;

function inject(serv,player)
{
  function addPlayer()
  {
    serv.entityMaxId++;
    player.entity=new Entity(serv.entityMaxId);
    serv.entities[player.entity.id]=player.entity;
    player.entity.player=player;
    player.entity.health = 20;
    player.entity.food = 20;
    player.playerViewDistance = 150;
    player.view=8;
    player.world=serv.overworld;
    player.username=player._client.username;
    serv.players.push(player);
    serv.uuidToPlayer[player._client.uuid] = player;
    player.loadedChunks={};
    player.nearbyPlayers=[];
  }

  function updateAndSpawnNearbyPlayers()
  {
    player.lastPositionPlayersUpdated=player.entity.position;
    var updatedPlayers=player.getNearby();
    var playersToAdd=updatedPlayers.filter(p => player.nearbyPlayers.indexOf(p)==-1);
    var playersToRemove=player.nearbyPlayers.filter(p => updatedPlayers.indexOf(p)==-1);
    player.despawnPlayers(playersToRemove);
    playersToAdd.forEach(player.spawnAPlayer);

    playersToRemove.forEach(p => p.despawnPlayers([player]));
    playersToRemove.forEach(p => p.nearbyPlayers=p.getNearby());
    playersToAdd.forEach(p => p.spawnAPlayer(player));
    playersToAdd.forEach(p => p.nearbyPlayers=p.getNearby());

    player.nearbyPlayers=updatedPlayers;

  }

  function sendPlayersWhenMove()
  {
    player.on("positionChanged",function(){
      if(player.entity.position.distanceTo(player.lastPositionPlayersUpdated)>2*32)
        player.updateAndSpawnNearbyPlayers();
    });
  }

  function sendLogin()
  {
    // send init data so client will start rendering world
    player._client.write('login', {
      entityId: player.entity.id,
      levelType: 'default',
      gameMode: player.gameMode,
      dimension: 0,
      difficulty: 0,
      reducedDebugInfo: false,
      maxPlayers: serv._server.maxPlayers
    });
    player.entity.position=player.spawnPoint.toFixedPosition();
  }

  function sendChunkWhenMove()
  {
    player.on("positionChanged",function(){
      if(!player.sendingChunks && player.entity.position.distanceTo(player.lastPositionChunkUpdated)>16*32)
        player.sendRestMap();
    });
  }

  function updateTime()
  {
    player._client.write('update_time', {
      age: [0, 0],
      time: [0, serv.time]
    });
  }

  function setGameMode(gameMode)
  {
    player._client.write('game_state_change', {
      reason: 3,
      gameMode: gameMode
    });
    player.gameMode=gameMode;
  }

  function fillTabList()
  {
    player._writeOthers('player_info',{
      action: 0,
      data: [{
        UUID: player._client.uuid,
        name: player.username,
        properties: [],
        gamemode: player.gameMode,
        ping: 1
      }]
    });

    player._client.write('player_info', {
      action: 0,
      data: serv.players.map((otherPlayer) => ({
        UUID: otherPlayer._client.uuid,
        name: otherPlayer.username,
        properties: [],
        gamemode: otherPlayer.gameMode,
        ping: 1
      }))
    });
  }

  function announceJoin()
  {
    serv.broadcast(player.username + ' joined the game.', "yellow");
    player.emit("connected");
  }

  async function login()
  { 
    if (serv.uuidToPlayer[player._client.uuid]) {
      player._client.end("You are already connected");
      return;
    }
    if (serv.bannedPlayers[player._client.uuid]) {
      player.kick(serv.bannedPlayers[player._client.uuid].reason);
      return;
    }

    addPlayer();
    sendLogin();
    await player.sendMap();
    player.sendSpawnPosition();
    player.sendPosition();
    player.updateHealth(player.entity.health);


    updateTime();
    setGameMode(player.gameMode);
    fillTabList();
    player.updateAndSpawnNearbyPlayers();

    announceJoin();
    player.emit("spawned");
    sendPlayersWhenMove();

    setTimeout(function(){player.sendRestMap();sendChunkWhenMove();},100);
  }

  player.setGameMode=setGameMode;
  player.login=login;
  player.updateAndSpawnNearbyPlayers=updateAndSpawnNearbyPlayers;
}