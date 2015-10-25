var vec3 = require("vec3");

module.exports=inject;

vec3.Vec3.prototype.toFixedPosition=function() {
  return this.scaled(32).floored();
};

function inject(serv,player)
{
  player._client.on('look', function(packet) {
    sendLook(packet.yaw,packet.pitch,packet.onGround)
  });

  // float (degrees) --> byte (1/256 "degrees")
  function conv(f){
    var b = (f % 360) * 256 / 360;
    if (b < -128) b += 256;
    else if (b > 127) b -= 256;
    return Math.floor(b);
  }
  function sendLook(yaw,pitch,onGround)
  {
    var convYaw=conv(yaw);
    var convPitch=conv(pitch);
    if (convYaw == player.entity.yaw && convPitch == player.entity.pitch) return;
    player._writeOthersNearby("entity_look", {
      entityId: player.entity.id,
      yaw: convYaw,
      pitch: convPitch,
      onGround: onGround
    });
    player.entity.yaw = convYaw;
    player.entity.pitch = convPitch;
    player.entity.onGround = onGround;
    player._writeOthersNearby("entity_head_rotation", {
      entityId: player.entity.id,
      headYaw: convYaw
    });
  }

  player._client.on('position', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(position.toFixedPosition(), onGround);
  });

  player._client.on('position_look', function (packet) {
    var position = new vec3(packet.x, packet.y, packet.z);
    var onGround = packet.onGround;
    sendRelativePositionChange(position.toFixedPosition(), onGround);
    sendLook(packet.yaw,packet.pitch,packet.onGround);
  });

  function sendRelativePositionChange(newPosition, onGround) {
    if (player.entity.position.distanceTo(new vec3(0, 0, 0)) != 0) {
      var diff = newPosition.minus(player.entity.position);
      if(diff.abs().x>127 || diff.abs().y>127 || diff.abs().z>127)
      {
        player._writeOthersNearby('entity_teleport', {
          entityId:player.entity.id,
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
          yaw: player.entity.yaw,
          pitch: player.entity.pitch,
          onGround: onGround
        });
      }
      else if (diff.distanceTo(new vec3(0, 0, 0)) != 0) {
        player._writeOthersNearby('rel_entity_move', {
          entityId: player.entity.id,
          dX: diff.x,
          dY: diff.y,
          dZ: diff.z,
          onGround: onGround
        });
      }
    }
    player.entity.position = newPosition;
    player.entity.onGround = onGround;
    player.emit("positionChanged");
  }

  function sendPosition() {
    player._client.write('position', {
      x: player.entity.position.x/32,
      y: player.entity.position.y/32,
      z: player.entity.position.z/32,
      yaw: player.entity.yaw,
      pitch: player.entity.pitch,
      flags: 0x00
    });
  }
  player.sendPosition = sendPosition;
}