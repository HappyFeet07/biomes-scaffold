// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { Slice, SliceLib } from "@latticexyz/store/src/Slice.sol";
import { Hook } from "@latticexyz/store/src/Hook.sol";
import { IERC165 } from "@latticexyz/world/src/IERC165.sol";
import { ICustomUnregisterDelegation } from "@latticexyz/world/src/ICustomUnregisterDelegation.sol";
import { IOptionalSystemHook } from "@latticexyz/world/src/IOptionalSystemHook.sol";
import { BEFORE_CALL_SYSTEM, AFTER_CALL_SYSTEM, ALL } from "@latticexyz/world/src/systemHookTypes.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { OptionalSystemHooks } from "@latticexyz/world/src/codegen/tables/OptionalSystemHooks.sol";

import { IWorld } from "@biomesaw/world/src/codegen/world/IWorld.sol";
import { VoxelCoord } from "@biomesaw/utils/src/Types.sol";
import { getEntityFromPlayer, getPosition } from "../utils/EntityUtils.sol";

contract Game is ICustomUnregisterDelegation, IOptionalSystemHook {

  ResourceId MoveSystemId = WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: "", name: "MoveSystem" });

  struct Area {
    VoxelCoord lowerSouthwestCorner;
    VoxelCoord size;
  }
 
  struct NamedArea {
    string name;
    Area area;
  }

  address public immutable biomeWorldAddress;
  address public delegatorAddress;
  mapping(address => mapping(uint8 => bool)) public playerObjectTypes;
  mapping(address => NamedArea[]) public foundAreas;
  uint256 constant public max = 30;

  constructor(address _biomeWorldAddress, address _delegatorAddress) {
    biomeWorldAddress = _biomeWorldAddress;

    // Set the store address, so that when reading from MUD tables in the
    // Biomes world, we don't need to pass the store address every time.
    StoreSwitch.setStoreAddress(_biomeWorldAddress);

    delegatorAddress = _delegatorAddress;
  }

  // Use this modifier to restrict access to the Biomes World contract only
  // eg. for hooks that are only allowed to be called by the Biomes World contract
  modifier onlyBiomeWorld() {
    require(msg.sender == biomeWorldAddress, "Caller is not the Biomes World contract");
    _; // Continue execution
  }

  function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
    return
      interfaceId == type(ICustomUnregisterDelegation).interfaceId ||
      interfaceId == type(IOptionalSystemHook).interfaceId ||
      interfaceId == type(IERC165).interfaceId;
  }

  function setPlayerObjectTypes(address player, uint8[] memory objectTypes) external {
    for (uint256 i = 0; i < objectTypes.length; i++) {
      playerObjectTypes[player][objectTypes[i]] = !playerObjectTypes[player][objectTypes[i]];
    }
  }

  function canUnregister(address delegator) external override onlyBiomeWorld returns (bool) {
    return true;
  }

  function registerMapReader(uint8[] memory objectTypes) external {
    for (uint256 i = 0; i < objectTypes.length; i++) {
      playerObjectTypes[msg.sender][objectTypes[i]] = true;
    }
  }

  function onRegisterHook(
    address msgSender,
    ResourceId systemId,
    uint8 enabledHooksBitmap,
    bytes32 callDataHash
  ) external override onlyBiomeWorld {}

  function onUnregisterHook(
    address msgSender,
    ResourceId systemId,
    uint8 enabledHooksBitmap,
    bytes32 callDataHash
  ) external override onlyBiomeWorld {
  }

  function onBeforeCallSystem(
    address msgSender,
    ResourceId systemId,
    bytes memory callData
  ) external override onlyBiomeWorld {}

  function onAfterCallSystem(
    address msgSender,
    ResourceId systemId,
    bytes memory callData
  ) external override onlyBiomeWorld {
    if (ResourceId.unwrap(systemId) == ResourceId.unwrap(MoveSystemId)) {
      VoxelCoord memory playerPosition = getPosition(getEntityFromPlayer(msgSender));
      playerPosition.x = playerPosition.x - 5;
      playerPosition.y = playerPosition.y - 5; 
      playerPosition.z = playerPosition.z - 5; 
      Area memory area = Area(playerPosition, VoxelCoord(10, 10, 10));
      _findTargetInArea(msgSender, area);
    }
  }

  function getDisplayName() external pure returns (string memory) {
    return "Ore Seeker";
  }


  function _findTargetInArea(address player, Area memory area) internal {
    VoxelCoord memory lowerSouthwestCorner = area.lowerSouthwestCorner;
    VoxelCoord memory size = area.size;
    delete foundAreas[player];

    for (int16 x = lowerSouthwestCorner.x; x < lowerSouthwestCorner.x + size.x; x++) {
      for (int16 y = lowerSouthwestCorner.y; y < lowerSouthwestCorner.y + size.y; y++) {
        for (int16 z = lowerSouthwestCorner.z; z < lowerSouthwestCorner.z + size.z; z++) {
          uint8 typeId = IWorld(biomeWorldAddress).getTerrainObjectTypeId(VoxelCoord(x, y, z));
          if (playerObjectTypes[player][typeId] == true) {
            Area memory foundArea = Area(VoxelCoord(x, y, z), VoxelCoord(1, 250, 1));
            NamedArea memory namedArea = NamedArea("Found Area", foundArea);
            foundAreas[player].push(namedArea);
          }
        }
      }
    }
  }

  function getAreas() external view returns (NamedArea[] memory) {
    return 
  }

  function basicGetter() external view returns (uint256) {
    return 42;
  }

  function getUserAreas(address player) external view returns (NamedArea[] memory) {
    return foundAreas[player];
  }

  function getRegisteredPlayers() external view returns (address[] memory) {
    return new address[](0);
  }
}