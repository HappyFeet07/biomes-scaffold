"use client";

import { useEffect, useState } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { displayTxResult } from "./utilsDisplay";
import {
  areValidBuilds,
  areValidBuildsWithPos,
  isAreaArray,
  isArrayofBytes32,
  isBytes32,
  isValidArea,
  isValidBuild,
  isValidBuildWithPos,
} from "./utilsDisplay";
import { Abi, AbiFunction } from "abitype";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Address } from "viem";
import { useContractRead } from "wagmi";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useAnimationConfig } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export function Copy({ result }: { result: unknown }) {
  const [copied, setCopied] = useState(false);
  const resultString = JSON.stringify(result, null, 2);

  return (
    <div>
      {copied ? (
        <CheckCircleIcon className="text-xl font-normal text-white h-5 w-5 cursor-pointer" aria-hidden="true" />
      ) : (
        <CopyToClipboard
          text={resultString}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 800);
          }}
        >
          <DocumentDuplicateIcon className="text-xl font-normal text-white h-5 w-5 cursor-pointer" aria-hidden="true" />
        </CopyToClipboard>
      )}
    </div>
  );
}

type DisplayVariableProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  refreshDisplayVariables: boolean;
  inheritedFrom?: string;
  abi: Abi;
  poll?: number;
};

export const DisplayVariable = ({
  contractAddress,
  abiFunction,
  refreshDisplayVariables,
  abi,
  inheritedFrom,
  children,
  poll,
}: DisplayVariableProps & {
  children?: (props: {
    result: any;
    isFetching: boolean;
    CopyButton: React.ReactNode;
    RefreshButton: React.ReactNode;
  }) => React.ReactNode;
}) => {
  const {
    data: result,
    isFetching,
    refetch,
  } = useContractRead({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: abi,
    onError: error => {
      notification.error(error.message);
    },
  });

  const { showAnimation } = useAnimationConfig(result);

  useEffect(() => {
    refetch();

    if (poll) {
      const interval = setInterval(() => {
        refetch();
      }, poll);
      return () => clearInterval(interval);
    }
  }, [refetch, refreshDisplayVariables]);

  // Render Copy button as a component for easy use in children
  const CopyButton =
    isValidArea(result) ||
    isAreaArray(result) ||
    isBytes32(result) ||
    isArrayofBytes32(result) ||
    isValidBuild(result) ||
    isValidBuildWithPos(result) ||
    areValidBuilds(result) ||
    areValidBuildsWithPos(result) ? (
      <Copy result={result} />
    ) : null;

  const RefreshButton = (
    <button className="btn btn-ghost btn-xs" onClick={async () => await refetch()}>
      {!poll && isFetching ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <ArrowPathIcon className="h-3 w-3 cursor-pointer" aria-hidden="true" />
      )}
    </button>
  );

  if (children) {
    return <>{children({ result, isFetching, CopyButton, RefreshButton })}</>;
  }

  return (
    <div className="space-y-1 pb-4">
      <div className="flex items-center">
        <h3 className="font-medium text-md mb-0 break-all">{abiFunction.name}</h3>
        {RefreshButton}
        {CopyButton}
        <InheritanceTooltip inheritedFrom={inheritedFrom} />
      </div>
      <div className="text-gray-500 font-medium flex flex-col items-start">
        <div
          className={`break-all block transition bg-transparent ${
            showAnimation ? "bg-warning rounded-sm animate-pulse-fast" : ""
          }`}
        >
          {displayTxResult(result)}
        </div>
      </div>
    </div>
  );
};