import express, { Request, Response } from "express";
import { scan } from "./readMapTiles";

const app = express();
const PORT = 3001;

app.get("/askFind", async (req: Request, res: Response) => {
  const player = req.query.player as string;
  const objectType = (req.query.objectType as string)
    .slice(1, -1)
    .split(",")
    .map(x => parseInt(x));
  console.log(player, objectType);
  const result = await scan(player, objectType);

  res.send(JSON.stringify(convertBigIntToNumber(result)));
});

function convertBigIntToNumber(obj: any): any {
  if (typeof obj === "bigint") {
    return Number(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  } else if (typeof obj === "object" && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
