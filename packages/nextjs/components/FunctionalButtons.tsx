import React, { useState } from "react";
import { TransactionReceipt } from "viem";
import { useWriteContract } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth";

interface CheckboxItem {
  id: number;
  checked: boolean;
  img: string;
  alt: string;
}

type SubmitButtonProps = {
  hookAddress: string;
  objectIds: CheckboxItem[];
  snapshot: CheckboxItem[];
};

const findDiff = (a: CheckboxItem[], b: CheckboxItem[]) => {
  return a
    .filter((item, index) => {
      return item.checked !== b[index].checked;
    })
    .map(item => item.id);
};

export const SubmitSelect: React.FC<SubmitButtonProps> = ({ hookAddress, objectIds, snapshot }) => {
  const writeTxn = useTransactor();
  const { data: deployedContractData } = useDeployedContractInfo("Game");
  const { writeContractAsync } = useWriteContract();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTransaction = async () => {
    const toggles = findDiff(objectIds, snapshot);
    try {
      const makeWriteWithParams = () =>
        writeContractAsync({
          address: hookAddress,
          abi: deployedContractData!.abi,
          functionName: "setPlayerObjectTypes",
          args: [toggles],
        });
      return await writeTxn(makeWriteWithParams, {
        onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
          (async () => {
            setSubmitted(true);
          })();
          console.log("Transaction receipt:", txnReceipt);
        },
      });
    } catch (error) {
      console.error("Error submitting transaction:", error);
      await setSubmitted(false);
    }
  };

  return (
    <div className="flex flex-col justify-right space-y-2">
      <div>
        <button
          className="flex gap-4 border border-white/20 p-2 font-mono uppercase text-sm leading-none transition bg-biomes hover:border-white"
          onClick={handleSubmitTransaction}
          disabled={submitted}
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};
