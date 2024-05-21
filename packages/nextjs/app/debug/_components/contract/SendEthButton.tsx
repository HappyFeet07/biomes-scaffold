"use client";

import React from "react";
import { Abi } from "abitype";
import { TransactionReceipt } from "viem";
import { useWriteContract } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";

interface CheckboxItem {
  id: number;
  checked: boolean;
  img: string;
  alt: string;
}

interface SendEthButton {
  contractAddress: string;
  abi: Abi;
  functionName: string;
  snapshot: CheckboxItem[];
  objectIds: CheckboxItem[];
  onWrite: (txnReceipt: TransactionReceipt) => void;
}

const findDiff = (a: CheckboxItem[], b: CheckboxItem[]) => {
  console.log(a);
  console.log(b);
  return a
    .filter((item, index) => {
      return item.checked !== b[index].checked;
    })
    .map(item => item.id);
};

export const SendEthButton: React.FC<SendEthButton> = ({
  contractAddress,
  abi,
  functionName,
  snapshot,
  objectIds,
  onWrite,
}) => {
  const writeTxn = useTransactor();
  const [isLoading, setIsLoading] = React.useState(false);

  const { writeContractAsync } = useWriteContract();

  const handleWriteTransaction = async () => {
    const diff = findDiff(objectIds, snapshot);
    console.log(diff);
    try {
      setIsLoading(true);
      const makeWriteWithParams = () =>
        writeContractAsync({
          address: contractAddress,
          abi: abi,
          functionName: functionName,
          args: [diff],
        });
      return await writeTxn(makeWriteWithParams, {
        onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
          (async () => {
            await onWrite(txnReceipt);
            setIsLoading(false);
          })();
        },
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        className="w-full text-center border border-white/20 p-2 font-mono uppercase text-sm transition bg-biomes hover:border-white"
        onClick={() => handleWriteTransaction()}
        disabled={isLoading}
      >
        {" "}
        Toggle{" "}
      </button>
    </div>
  );
};
