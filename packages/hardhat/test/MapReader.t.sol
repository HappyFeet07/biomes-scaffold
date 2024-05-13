// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import { MapReader, VoxelCoord, Area } from "../contracts/MapReader.sol";
import { hasBeforeAndAfterSystemHook, getEntityAtCoord, getEntityFromPlayer, getPosition, getIsLoggedOff, getPlayerFromEntity } from "../utils/EntityUtils.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

contract MapReaderTest is Test {
  MapReader reader;
  address player = 0x9C179d698ddb0f9BEE55d223AE7D354597a8F877;
  function test_read() public {
    vm.createSelectFork("https://rpc.garnetchain.com");
    address world = 0x641554ED9D8A6c2C362E6c3Fb2835EC2ca4dA95C;
    StoreSwitch.setStoreAddress(world);
    reader = new MapReader(world);
    vm.startPrank(player);
    VoxelCoord memory playerPosition = reader.getPlayerLocation(player);
    // getPosition(getEntityFromPlayer(player));
    console2.log("Player Position: ", playerPosition.x);
    console2.log("Player Position: ", playerPosition.y);
    console2.log("Player Position: ", playerPosition.z);
    playerPosition.x -= 5;
    playerPosition.y -= 5;
    playerPosition.z -= 5;
    for (uint256 i = 0; i < 10; i++) {
      playerPosition.y += 1;
      Area memory area = Area(playerPosition, VoxelCoord(11, 1, 11));
      (uint256 found,) = reader.foundTargetInArea(area, 113);
      console2.log("Found: ", found);
    }
  }
}%