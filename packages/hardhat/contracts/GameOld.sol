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

struct Area {
  VoxelCoord lowerSouthwestCorner;
  VoxelCoord size;
}
 
struct NamedArea {
  string name;
  Area area;
}

contract GameOld is ICustomUnregisterDelegation, IOptionalSystemHook {
  address public immutable biomeWorldAddress;
  address public updater;
  address public delegatorAddress;
  uint256 public price;
  mapping(address => NamedArea[]) public playerAreas;
  mapping(address => uint256) public playerSession;

  constructor(
    address _biomeWorldAddress,
    address _delegatorAddress,
    address _updater,
    uint256 _price
  ) {
    biomeWorldAddress = _biomeWorldAddress;

    // Set the store address, so that when reading from MUD tables in the
    // Biomes world, we don't need to pass the store address every time.
    StoreSwitch.setStoreAddress(_biomeWorldAddress);
    delegatorAddress = _delegatorAddress;
    updater = _updater;
    price = _price;
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

  function canUnregister(address delegator) external override onlyBiomeWorld returns (bool) {
    return true;
  }

  function updatePrice(uint256 _price) external {
    require(msg.sender == updater, "Caller is not the delegator");
    price = _price;
  }

  function onRegisterHook(
    address msgSender,
    ResourceId systemId,
    uint8 enabledHooksBitmap,
    bytes32 callDataHash
  ) external override onlyBiomeWorld {
  }

  function registerSeeker() external payable {
    require(
      playerSession[msg.sender] > block.timestamp || playerSession[msg.sender] == 0,
      "Session expired"
    );
    require(msg.value >= 1 ether, "Insufficient funds");
    playerSession[msg.sender] = block.timestamp + 1 hours;
  }

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
  ) external override onlyBiomeWorld {}

  function basicGetter() external view returns (uint256) {
    return 42;
  }

  function getRegisteredPlayers() external view returns (address[] memory) {
    return new address[](0);
  }

  function updatePlayersQueryResult(address player, NamedArea[] memory found) external {
    require(msg.sender == updater, "Caller is not the updater");
    delete playerAreas[player];
    for(uint256 i = 0; i < found.length; i++) {
      playerAreas[player].push(found[i]);
    }
  }

  function getAreas() external view returns (NamedArea[] memory) {
    return playerAreas[msg.sender];
  }
}
