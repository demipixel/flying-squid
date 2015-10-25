module.exports=inject;

function inject(serv, player) 
{
  player._client.on("arm_animation", function(packet) {
    player._writeOthersNearby("animation", {
      entityId: player.entity.id,
      animation: 0
    });
  });

  function setMetadata(metadata)
  {
    player.entity.metadata = metadata;
    player._writeOthersNearby("entity_metadata", {
      entityId: player.entity.id,
      metadata: player.entity.metadata
    });
  }

  player._client.on("entity_action", function(packet) {
    if(packet.actionId == 3) {
      setMetadata([{"key":0,"type":0,"value": 0x08}]);
    } else if(packet.actionId == 4) {
      setMetadata([{"key":0,"type":0,"value": 0x00}]);
    } else if(packet.actionId == 0) {
      setMetadata([{"key":0,"type":0,"value": 0x02}]);
      player.entity.crouching = true;
    } else if(packet.actionId == 1) {
      setMetadata([{"key":0,"type":0,"value": 0x00}]);
      player.entity.crouching = false;
    }
  });
}