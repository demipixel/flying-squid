const Vec3 = require("vec3").Vec3;

module.exports.server=function(serv) {

  serv.randomTickRate = 3; // Default in Vanilla so why not

  serv.on('tick', (a,tickCount) => {
    const updateWorlds = [serv.overworld,serv.netherworld];
    for (let world of updateWorlds) {
      for (let columnPos of Object.keys(world.columns)) {
        if (columnPos != '0,0') continue; // FOR TESTING PURPOSES, only chunk 0,0
        const column = world.columns[columnPos];
        const split = columnPos.split(',');
        const chunkX = split[0];
        const chunkZ = split[1];
        for (let j = 0; j < 16; j++) {
          for (let i = 0; i < serv.randomTickRate; i++) {
            let pos = (new Vec3(chunkX*16 + Math.random()*16, j*16 + Math.random()*16, chunkZ*16 + Math.random()*16)).floor();

            (async () => {
              const type = await world.getBlockType(pos);
              const data = await world.getBlockData(pos);
              serv.behavior('randomTickBlock', {
                world: world,
                position: pos,
                blockType: type,
                blockData: data
              }, ({world, position, blockType, blockData}) => {
                serv.randomTickBlock(world, position, blockType, blockData);
              });
            })();
          }
        }
      }
    }
  });

  serv.randomTickBlock = async (world, pos, id, data) => {
    if (id == 1 && data == 0) { // Dirt
      const above = world.getBlockType(pos.add(new Vec3(0,1,0)));
      if (above != 0) return false;
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          if (x == 1 && z == 1) continue;
          const nextto = world.getBlockType.pos.add(new Vec3(x,0,z));
          if (nextto == 2) {
            console.log('hre');
            await world.setBlockType(pos, 2); // Set to grass
            await world.setBlockData(pos, 0);
            return true;
          }
        }
      }
      return false;
    }
  }


}