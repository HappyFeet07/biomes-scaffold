// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../utils/AreaUtils.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "@biomesaw/world/src/codegen/world/IWorld.sol";
import { VoxelCoord } from "@biomesaw/utils/src/Types.sol";
import { MAX_PLAYER_BUILD_MINE_HALF_WIDTH, PLAYER_HAND_DAMAGE } from "@biomesaw/world/src/Constants.sol";
import { hasBeforeAndAfterSystemHook, getEntityAtCoord, getEntityFromPlayer, getPosition, getIsLoggedOff, getPlayerFromEntity } from "../utils/EntityUtils.sol";
import {
  CoalOreObjectID, GoldOreObjectID, SilverOreObjectID, DiamondOreObjectID, NeptuniumOreObjectID
} from "@biomesaw/world/src/ObjectTypeIds.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

contract MapReader {

  address worldAddress;
  uint256 max = 30;

  constructor(address world) {
    worldAddress = world;
    StoreSwitch.setStoreAddress(world);
  }

  function getPlayerLocation(address player) public view returns (VoxelCoord memory playerPosition) {
    playerPosition = getPosition(getEntityFromPlayer(player));
  }

  function foundTargetInArea(Area memory area,uint8 objectTypeId) external view returns (uint256 numFound, VoxelCoord[] memory) {
    VoxelCoord memory lowerSouthwestCorner = area.lowerSouthwestCorner;
    VoxelCoord memory size = area.size;

    VoxelCoord[] memory foundVoxelCoord = new VoxelCoord[](max);

    for (int16 x = lowerSouthwestCorner.x; x < lowerSouthwestCorner.x + size.x; x++) {
      for (int16 y = lowerSouthwestCorner.y; y < lowerSouthwestCorner.y + size.y; y++) {
        for (int16 z = lowerSouthwestCorner.z; z < lowerSouthwestCorner.z + size.z; z++) {
          uint8 typeId = IWorld(worldAddress).getTerrainObjectTypeId(VoxelCoord(x, y, z));
          if (typeId == objectTypeId) {
            foundVoxelCoord[numFound] = VoxelCoord(x, y, z);
            numFound++;
            if (numFound >= max) {
              return (numFound, foundVoxelCoord);
            }
          }
        }
      }
    }
    return (numFound, foundVoxelCoord);
  }
}