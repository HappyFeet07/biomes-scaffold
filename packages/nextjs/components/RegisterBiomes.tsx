import { useEffect, useState } from "react";
import coal_ore_Icon from "../public/ores/coel_ore_lcon.svg";
import diamond_ore_Icon from "../public/ores/diamond_ore_icon.svg";
import gold_ore_Icon from "../public/ores/gold_ore_icon.svg";
import mushroom_Icon from "../public/ores/mushroom_icon.svg";
import neptunium_ore_Icon from "../public/ores/neptunium_ore_icon.svg";
import silver_ore_Icon from "../public/ores/silver_ore_icon.svg";
import { CardSection, SelectingField } from "./Card";
import { SubmitSelect } from "./FunctionalButtons";
import { ObjectIdSelected } from "./ObjectIdSelected";
import { BEFORE_AND_AFTER_CALL_SYSTEM, RegisterDelegationButton, RegisterHookButton } from "./RegisterButtons";
import { useAccount, usePublicClient } from "wagmi";
import {
  COAL_ORE_OBJECT_ID,
  DIAMOND_ORE_OBJECT_ID,
  GOLD_ORE_OBJECT_ID,
  NEPTUNIUM_ORE_OBJECT_ID,
  RED_MUSHROOM_OBJECT_ID,
  SILVER_ORE_OBJECT_ID,
} from "~~/components/ObjectTypeIds";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { getAllContracts } from "~~/utils/scaffold-eth/contractsData";

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

const contractsData = getAllContracts();

const GameRequiredHooks: string[] = ["LogoffSystem", "MoveSystem"];

export const RegisterBiomes: React.FC = ({}) => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo("Game");

  const setIsBiomesRegistered = useGlobalState(({ setIsBiomesRegistered }) => setIsBiomesRegistered);

  const [hooksRegistered, setHooksRegistered] = useState(false);
  const [delegationRegistered, setDelegationRegistered] = useState(false);
  const [isDelegatorAddress, setIsDelegatorAddress] = useState(false);

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

  const checkDelegatorAddress = async () => {
    if (connectedAddress === undefined || deployedContractData === undefined || deployedContractLoading) {
      setIsDelegatorAddress(false);
      setDelegationRegistered(true);
      return;
    }
    if (!publicClient) return;

    const delegatorAddress = await publicClient.readContract({
      address: deployedContractData?.address,
      abi: deployedContractData?.abi,
      functionName: "delegatorAddress",
      args: [],
    });
    if (delegatorAddress === undefined || delegatorAddress === null || typeof delegatorAddress !== "string") {
      setIsDelegatorAddress(false);
      setDelegationRegistered(true);
      return;
    }
    const newIsDelegator = delegatorAddress.toLowerCase() === connectedAddress.toLowerCase();
    setIsDelegatorAddress(newIsDelegator);
    if (newIsDelegator) {
      setDelegationRegistered(false);
    } else {
      setDelegationRegistered(true);
    }
  };

  useEffect(() => {
    if (deployedContractData) {
      const hasDelegatorAddress = deployedContractData?.abi.some(abi => abi.name === "delegatorAddress");
      if (hasDelegatorAddress) {
        checkDelegatorAddress();
      } else {
        setDelegationRegistered(true);
      }
    }
    readPlayerSearching();
  }, [connectedAddress, deployedContractData]);

  useEffect(() => {
    if (hooksRegistered && delegationRegistered) {
      setIsBiomesRegistered(true);
    } else {
      setIsBiomesRegistered(false);
    }
  }, [hooksRegistered, delegationRegistered]);

  if (connectedAddress === undefined) {
    return <div>Connect your wallet to continue</div>;
  }

  if (deployedContractData === undefined || deployedContractLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full p-mono">
      <div className="grid grid-cols-12 flex flex-1">
        <div className="col-span-12 lg:col-span-9 p-12 flex flex-col justify-between items-center">
          <div style={{ width: "100%" }}>
            <h1 className="text-3xl font-bold text-left mt-4">Manage Permissions</h1>
            <div>
              <h3 className="text-xl font-bold text-left mt-8">HOOKS</h3>
              <CardSection
                relevantSystems={GameRequiredHooks}
                description={"Description of why you need the player to register the hooks on LogoffSystem"}
              >
                <RegisterHookButton
                  hookAddress={contractsData["Game"].address}
                  playerAddress={connectedAddress}
                  systemIdNames={GameRequiredHooks}
                  enabledHooksBitmap={BEFORE_AND_AFTER_CALL_SYSTEM}
                  hooksRegistered={hooksRegistered}
                  setHooksRegistered={setHooksRegistered}
                />
              </CardSection>
            </div>
            <div>
              <h3 className="text-xl font-bold text-left mt-8">CONFIGS</h3>
              <SelectingField topic={"IN SEARCH"} description={"Selected materials to search for:"}>
                {isReadComplete && (
                  <ObjectIdSelected onChange={handleChange} checkedItems={checkedItems}>
                    {" "}
                  </ObjectIdSelected>
                )}
                <SubmitSelect
                  hookAddress={deployedContractData?.address}
                  snapshot={snapshot}
                  objectIds={checkedItems}
                ></SubmitSelect>
              </SelectingField>
            </div>
            {deployedContractData.abi.some(abi => abi.name === "delegatorAddress") && isDelegatorAddress && (
              <div className="pt-4">
                <h3 className="text-xl font-bold text-left">DELEGATIONS</h3>
                <CardSection description={"Delegate unlimited access to the Game contract"}>
                  <RegisterDelegationButton
                    delegateeAddress={contractsData["Game"].address}
                    playerAddress={connectedAddress}
                    delegationRegistered={delegationRegistered}
                    setDelegationRegistered={setDelegationRegistered}
                  />
                </CardSection>
              </div>
            )}
          </div>
        </div>
        <div
          className="col-span-12 lg:col-span-3 p-12"
          style={{ backgroundColor: "#160b21", borderLeft: "1px solid #0e0715" }}
        >
          <div>
            <div
              className="p-4 flex flex-col gap-2 mb-8"
              style={{ border: "0.5px solid white", borderRadius: "2px", backgroundColor: "#1c0d29" }}
            >
              <div style={{ borderBottom: "0.5px solid white", textAlign: "center", paddingBottom: "6px" }}>ⓘ</div>
              <div className="text-sm">
                Hooks execute additional logic every time you take the action they are registered on.
              </div>
              <div className="text-sm">
                Delegations allow this game&apos;s smart contract to perform actions on your behalf.
              </div>
            </div>

            <div
              className="p-4 flex flex-col gap-2"
              style={{ border: "1px solid rgb(242 222 12)", background: "#854D0E" }}
            >
              <div style={{ borderBottom: "0.5px solid rgb(242 222 12)", textAlign: "center", paddingBottom: "6px" }}>
                ⚠️
              </div>
              <div className="text-sm font-semibold" style={{ color: "#FEF08A" }}>
                Unregister your hooks when done playing!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
