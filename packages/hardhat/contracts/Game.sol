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

  uint256 constant public MAX_RETURN_LENGTH = 10;
  address public immutable biomeWorldAddress;
  address public delegatorAddress;
  address public gameOwner;
  uint256 public counter = 0;
  uint256 public registerPrice = 0 ether;
  VoxelCoord public defaultSearchSize = VoxelCoord(5, 7, 5);

  mapping(address => bool) public inited;
  mapping(address => mapping(uint8 => bool)) public playerObjectTypes;
  mapping(address => NamedArea[]) public foundAreas;
  mapping(address => VoxelCoord) public playerSearchSize;

  address[] public players;
  uint8[] public initItems = [
    113, // red mushroom,
    88, // coal ore
    89, // gold ore
    91, // silver ore
    93, // diamond ore
    95  // neptunium ore
  ];

  constructor(address _biomeWorldAddress, address _delegatorAddress) {
    biomeWorldAddress = _biomeWorldAddress;

    // Set the store address, so that when reading from MUD tables in the
    // Biomes world, we don't need to pass the store address every time.
    StoreSwitch.setStoreAddress(_biomeWorldAddress);

    delegatorAddress = _delegatorAddress;
    gameOwner = msg.sender;
  }

  error NotGameOwner();

  // Use this modifier to restrict access to the Biomes World contract only
  // eg. for hooks that are only allowed to be called by the Biomes World contract
  modifier onlyBiomeWorld() {
    require(msg.sender == biomeWorldAddress, "Caller is not the Biomes World contract");
    _; // Continue execution
  }

  modifier onlyOwner() {
    _onlyOwner(msg.sender);
    _;
  }

  function _onlyOwner(address who) internal view {
    if (who == gameOwner) {
      revert NotGameOwner();
    }
  }

  function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
    return
      interfaceId == type(ICustomUnregisterDelegation).interfaceId ||
      interfaceId == type(IOptionalSystemHook).interfaceId ||
      interfaceId == type(IERC165).interfaceId;
  }


  function register() external payable {
    require(msg.value >= registerPrice, "Not enough ether");
    require(!inited[msg.sender], "Already registered");
    inited[msg.sender] = true;
    playerSearchSize[msg.sender] = defaultSearchSize;
    _togglePlayerTargetObject(msg.sender, initItems);
  }

  function setRegisterPrice(uint256 price) external onlyOwner {
    registerPrice = price;
  }

  function setPlayerObjectTypes(uint8[] memory objectTypes) external {
    _togglePlayerTargetObject(msg.sender, objectTypes);
  }

  function setPlayerSearchSize(VoxelCoord memory _searchSize) external {
    require(_searchSize.x * _searchSize.y * _searchSize.z <= 175, "Search size too large");
    playerSearchSize[msg.sender] = _searchSize;
  }

  function checkRegistered() external view returns (bool) {
    return inited[msg.sender];
  }

  function canUnregister(address delegator) external override onlyBiomeWorld returns (bool) {
    return true;
  }

  function _togglePlayerTargetObject(address player, uint8[] memory objectTypes) internal {
    for (uint256 i = 0; i < objectTypes.length; i++) {
      playerObjectTypes[player][objectTypes[i]] = !playerObjectTypes[player][objectTypes[i]];
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
  ) external override onlyBiomeWorld {}

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
    VoxelCoord memory playerPosition = getPosition(getEntityFromPlayer(msgSender));
    VoxelCoord memory toSearch = playerSearchSize[msgSender];
    playerPosition.x = playerPosition.x - toSearch.x / 2;
    playerPosition.y = playerPosition.y - toSearch.y;
    playerPosition.z = playerPosition.z - toSearch.z / 2; 
    Area memory area = Area(playerPosition, toSearch);
    _findTargetInArea(msgSender, area);
  }

  function getDisplayName() external pure returns (string memory) {
    return "Ore Seeker";
  }

  function _findTargetInArea(address player, Area memory area) internal {
    delete foundAreas[player];
    VoxelCoord memory lowerSouthwestCorner = area.lowerSouthwestCorner;

    int16 xEnds = lowerSouthwestCorner.x + area.size.x;
    int16 yEnds = lowerSouthwestCorner.y + area.size.y;
    int16 zEnds = lowerSouthwestCorner.z + area.size.z;

    for (int16 x = lowerSouthwestCorner.x; x < xEnds; x++) {
      for (int16 z = lowerSouthwestCorner.z; z < zEnds; z++) {
        for (int16 y = lowerSouthwestCorner.y; y < yEnds; y++) {
          uint8 typeId = IWorld(biomeWorldAddress).getTerrainObjectTypeId(VoxelCoord(x, y, z));
          if (playerObjectTypes[player][typeId] == true) {
            Area memory foundArea = Area(VoxelCoord(x, y, z), VoxelCoord(1, 20, 1));
            NamedArea memory namedArea = NamedArea("Here", foundArea);
            foundAreas[player].push(namedArea);
            counter++;
            break;
          }
        }
      }
    }
  }

  function getAreas() external view returns (NamedArea[] memory) {
    NamedArea[] memory userAreas = foundAreas[msg.sender];
    uint256 returnLength = userAreas.length > MAX_RETURN_LENGTH ? MAX_RETURN_LENGTH : userAreas.length;
    NamedArea[] memory ret = new NamedArea[](returnLength);
    for (uint256 i = 0; i < returnLength; i++) {
      ret[i] = foundAreas[msg.sender][i];
    }
    return ret;
  }

  function basicGetter() external view returns (uint256) {
    return 42;
  }

  function getRegisteredPlayers() external view returns (address[] memory) {
    return players;
  }

  function withdrawEth() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }
}