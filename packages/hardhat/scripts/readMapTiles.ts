import { ethers } from "hardhat";
import { MapReader } from "../typechain-types";
import { VoxelCoordStruct } from "../typechain-types/@biomesaw/world/src/codegen/world/ITerrainSystem";

export type AreaStruct = {
  lowerSouthwestCorner: VoxelCoordStruct;
  size: VoxelCoordStruct;
};

const increaseY = (ori: AreaStruct, i: number): AreaStruct => {
  return {
    ...ori,
    lowerSouthwestCorner: {
      ...ori.lowerSouthwestCorner,
      y: BigInt(ori.lowerSouthwestCorner.y) - BigInt(i),
    },
  };
};

interface FindingResult {
  ObjectID: number;
  length: number;
  Result: VoxelCoordStruct[];
}

export const scan = async (player: string, objectType: number[]) => {
  const provider = new ethers.JsonRpcProvider("https://rpc.garnetchain.com");
  const signer = new ethers.Wallet("Your private key", provider);
  const readerAddress = "0xa134Eb3717AE07bEDdEf29cF0bbdA7E5657871F9";
  const mapReader = (await ethers.getContractAt("MapReader", readerAddress, signer)) as MapReader;
  const result = await findOres(mapReader, player, objectType);

  return result;
};

const getVoxelFromResult = (result: Array<any>) => {
  const [x, y, z] = Object.values(result);
  const ret: VoxelCoordStruct = { x: x, y: y, z: z };
  return ret;
};

const findOres = async (reader: MapReader, player: string, objectId: number[]) => {
  const playerLocation = await reader.getPlayerLocation(player);
  const found: FindingResult[] = [];
  for (let i = 0; i < objectId.length; i++) {
    const res = (await findOre(reader, playerLocation, objectId[i])).map(ret => {
      return getVoxelFromResult(ret);
    });
    found.push({ ObjectID: objectId[i], length: res.length, Result: res });
  }
  return found;
};

const findOre = async (reader: MapReader, playerLocation: VoxelCoordStruct, objectId: number) => {
  const leftBottom: AreaStruct = {
    lowerSouthwestCorner: {
      x: BigInt(playerLocation.x) - 5n,
      y: BigInt(playerLocation.y),
      z: BigInt(playerLocation.z) - 5n,
    },
    size: { x: 11n, y: 1n, z: 11n },
  };
  const promises = Array.from({ length: 11 }, (_, i) => {
    const localLeftBottom = increaseY(leftBottom, i);
    return reader.foundTargetInArea.staticCall(localLeftBottom, objectId);
  });
  const oreFound: any[] = [];
  console.log("Found Id: ", objectId);
  await Promise.all(promises).then(results => {
    results.forEach((result: any) => {
      const [num, rest] = result;
      if (num > 0n) {
        const toPush = rest
          .filter(item => {
            return !(item[0] === 0n && item[1] === 0n && item[2] === 0n);
          })
          .map((ret: any) => getVoxelFromResult(ret));
        oreFound.push(...toPush);
      }
    });
  });
  return oreFound;
};
