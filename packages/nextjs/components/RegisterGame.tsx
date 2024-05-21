import { useEffect, useReducer, useState } from "react";
import { SelectingField } from "./Card";
import { ObjectIdSelected } from "./ObjectIdSelected";
import { Abi, AbiFunction } from "abitype";
import { TransactionReceipt } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { DisplayVariable, displayTxResult } from "~~/app/debug/_components/contract";
import { SendEthButton } from "~~/app/debug/_components/contract/SendEthButton";
import {
  COAL_ORE_OBJECT_ID,
  DIAMOND_ORE_OBJECT_ID,
  GOLD_ORE_OBJECT_ID,
  NEPTUNIUM_ORE_OBJECT_ID,
  RED_MUSHROOM_OBJECT_ID,
  SILVER_ORE_OBJECT_ID,
} from "~~/components/ObjectTypeIds";
import coal_ore_Icon from "~~/components/assets/coel_ore_lcon.svg";
import diamond_ore_Icon from "~~/components/assets/diamond_ore_icon.svg";
import gold_ore_Icon from "~~/components/assets/gold_ore_icon.svg";
import mushroom_Icon from "~~/components/assets/mushroom_icon.svg";
import neptunium_ore_Icon from "~~/components/assets/neptunium_ore_icon.svg";
import silver_ore_Icon from "~~/components/assets/silver_ore_icon.svg";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { GenericContract, InheritedFunctions } from "~~/utils/scaffold-eth/contract";

interface CheckboxItem {
  id: number;
  checked: boolean;
  img: string;
  alt: string;
}

const supportedObjectIds = [
  COAL_ORE_OBJECT_ID,
  GOLD_ORE_OBJECT_ID,
  SILVER_ORE_OBJECT_ID,
  DIAMOND_ORE_OBJECT_ID,
  NEPTUNIUM_ORE_OBJECT_ID,
  RED_MUSHROOM_OBJECT_ID,
];

const checkboxItems: CheckboxItem[] = [
  { id: COAL_ORE_OBJECT_ID, checked: false, img: coal_ore_Icon, alt: "Coal" },
  { id: GOLD_ORE_OBJECT_ID, checked: false, img: gold_ore_Icon, alt: "Gold" },
  { id: SILVER_ORE_OBJECT_ID, checked: false, img: silver_ore_Icon, alt: "Silver" },
  { id: DIAMOND_ORE_OBJECT_ID, checked: false, img: diamond_ore_Icon, alt: "Diamond" },
  { id: NEPTUNIUM_ORE_OBJECT_ID, checked: false, img: neptunium_ore_Icon, alt: "Neptunium" },
  { id: RED_MUSHROOM_OBJECT_ID, checked: false, img: mushroom_Icon, alt: "Mushroom" },
];

export const RegisterGame: React.FC = ({}) => {
  const { address: connectedAddress } = useAccount();
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo("Game");
  const isGameRegistered = useGlobalState(({ isGameRegistered }) => isGameRegistered);
  const setIsGameRegistered = useGlobalState(({ setIsGameRegistered }) => setIsGameRegistered);
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const [refreshDisplayVariables] = useReducer(value => !value, false);

  const [checkedItems, setCheckedItems] = useState<CheckboxItem[]>(checkboxItems);
  const [snapshot, setSnapshot] = useState<CheckboxItem[]>(checkboxItems);
  const [isReadComplete, setIsReadComplete] = useState(false);

  const handleChange = (objectId: number) => {
    const newCheckedItems = checkedItems.map(item =>
      item.id === objectId ? { ...item, checked: !item.checked } : item,
    );
    setCheckedItems(newCheckedItems);
  };

  const readPlayerSearching = async () => {
    if (connectedAddress === undefined || deployedContractData === undefined || deployedContractLoading) {
      return;
    }
    if (!publicClient) return;

    const temp = checkedItems;
    for (let i = 0; i < supportedObjectIds.length; i++) {
      const supports = await publicClient.readContract({
        address: deployedContractData?.address,
        abi: deployedContractData?.abi,
        functionName: "playerObjectTypes",
        args: [connectedAddress, supportedObjectIds[i]],
      });
      if (supports === false) {
        temp[i].checked = false;
      } else {
        temp[i].checked = true;
      }
    }
    setCheckedItems(temp);
    setSnapshot(temp);
    setIsReadComplete(true);
  };

  const checkPlayerRegistered = async () => {
    if (connectedAddress === undefined || deployedContractData === undefined || deployedContractLoading) {
      setIsGameRegistered(false);
      return;
    }
    if (!publicClient) return;

    const registeredPlayers = await publicClient.readContract({
      address: deployedContractData.address,
      abi: deployedContractData.abi,
      functionName: "getRegisteredPlayers",
      args: [],
    });
    if (!Array.isArray(registeredPlayers)) {
      return;
    }
    setIsGameRegistered(false);
  };

  useEffect(() => {
    checkPlayerRegistered();
    readPlayerSearching();
  }, [connectedAddress, deployedContractData, deployedContractLoading]);

  if (connectedAddress === undefined) {
    return <div>Connect your wallet to continue</div>;
  }

  if (deployedContractData === undefined || deployedContractLoading) {
    return <div>Loading...</div>;
  }

  const writeFunctions = ((deployedContractData.abi as Abi).filter(part => part.type === "function") as AbiFunction[])
    .filter(fn => {
      const isWriteableFunction =
        fn.stateMutability !== "view" &&
        fn.stateMutability !== "pure" &&
        fn.name !== "onAfterCallSystem" &&
        fn.name !== "onBeforeCallSystem" &&
        fn.name !== "onRegisterHook" &&
        fn.name !== "onUnregisterHook" &&
        fn.name !== "canUnregister";
      return isWriteableFunction;
    })
    .map(fn => {
      return {
        fn,
        inheritedFrom: ((deployedContractData as GenericContract)?.inheritedFunctions as InheritedFunctions)?.[fn.name],
      };
    })
    .sort((a, b) => (b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1));

  const registerPlayFunctionData = writeFunctions.find(fn => fn.fn.name === "setPlayerObjectTypes");

  const viewFunctions = ((deployedContractData?.abi as Abi).filter(part => part.type === "function") as AbiFunction[])
    .filter(fn => {
      const isQueryableWithNoParams =
        (fn.stateMutability === "view" || fn.stateMutability === "pure") && fn.inputs.length === 0;
      return isQueryableWithNoParams;
    })
    .map(fn => {
      return {
        fn,
        inheritedFrom: ((deployedContractData as GenericContract)?.inheritedFunctions as InheritedFunctions)?.[fn.name],
      };
    })
    .sort((a, b) => (b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1));

  const basicGetterFn = viewFunctions.find(({ fn }) => fn.name === "basicGetter");

  return (
    <div className="flex-1 flex flex-col h-full p-mono">
      <div className="grid grid-cols-12 flex flex-1">
        <div className="col-span-12 lg:col-span-9 p-12 flex flex-col justify-between items-center">
          <div style={{ width: "80%" }} className="flex flex-col gap-12">
            <div>
              <h1 className="text-3xl font-bold text-left mt-4">Join Game</h1>
              <h1 className="text-left mt-4" style={{ lineHeight: "normal", margin: "0", wordWrap: "break-word" }}>
                Your Register Game Description
              </h1>
            </div>
            <div>
              {!isGameRegistered ? (
                <div>
                  <h3 className="text-xl font-bold text-left mt-8">CONFIGS</h3>
                  <SelectingField topic={"IN SEARCH"} description={"Selected materials to search for:"}>
                    {isReadComplete && (
                      <ObjectIdSelected onChange={handleChange} checkedItems={checkedItems}>
                        {" "}
                      </ObjectIdSelected>
                    )}
                  </SelectingField>
                  {registerPlayFunctionData ? (
                    <SendEthButton
                      contractAddress={deployedContractData.address}
                      abi={deployedContractData.abi as Abi}
                      objectIds={checkedItems}
                      snapshot={snapshot}
                      functionName={registerPlayFunctionData.fn.name}
                      onWrite={(txnReceipt: TransactionReceipt) => {
                        console.log("txnReceipt", txnReceipt);
                        checkPlayerRegistered();
                      }}
                    />
                  ) : (
                    <button
                      className="w-full btn btn-primary bg-secondary rounded-sm"
                      onClick={() => setIsGameRegistered(true)}
                    >
                      Mock Game Register
                    </button>
                  )}
                </div>
              ) : (
                <div>You&apos;re already registered for the game</div>
              )}
            </div>
          </div>
        </div>
        <div
          className="col-span-12 lg:col-span-3 p-12"
          style={{ backgroundColor: "#160b21", borderLeft: "1px solid #0e0715" }}
        >
          {basicGetterFn && (
            <DisplayVariable
              abi={deployedContractData.abi as Abi}
              abiFunction={basicGetterFn.fn}
              contractAddress={deployedContractData.address}
              key={"getter"}
              refreshDisplayVariables={refreshDisplayVariables}
              inheritedFrom={basicGetterFn.inheritedFrom}
              poll={10000}
            >
              {({ result, RefreshButton }) => {
                return (
                  <div
                    className="p-6 text-white text-center border border- border-white w-full"
                    style={{ backgroundColor: "#42a232" }}
                  >
                    <div className="text-sm font-bold flex justify-center items-center">
                      <span>YOUR GETTER</span> <span>{RefreshButton}</span>
                    </div>
                    <div className="text-4xl mt-2">{displayTxResult(result)}</div>
                  </div>
                );
              }}
            </DisplayVariable>
          )}
        </div>
      </div>
    </div>
  );
};
