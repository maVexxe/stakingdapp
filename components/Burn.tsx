import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { XFOLD_ABI } from "../const/xfoldabi";
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
  useBalance,
  useContractRead,
} from "wagmi";
import { XFOLD_ADDRESS, FOLD_ADDRESS } from "../const/contracts";
import { useDebounce } from "use-debounce";
import Image from "next/image";
import xfoldlogo from "../public/xfoldlogo.png";

export default function Burn() {
  const { address: USER_ADDRESS, isConnected: isConnected } = useAccount();
  const [UserInput, setUserInput] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const DebouncedUserInput = useDebounce(UserInput, 500); //catches value 500ms after UserInput stops changing
  let USER_INPUT_AMOUNT;
  if (parseFloat(DebouncedUserInput[0]) > 0.001) {
    USER_INPUT_AMOUNT = DebouncedUserInput[0];
    USER_INPUT_AMOUNT = ethers.utils.parseEther(USER_INPUT_AMOUNT);
  }

  const parseUserInput = (e) => {
    const value = e.target.value
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*?)\..*/g, "$1")
      .replace(/^0[^.]/, "0");
    setUserInput(value);
  };

  function OpenWalletModal() {
    const input = document.getElementById("my-modal-5") as HTMLInputElement;
    input.checked = true;
  }

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { data: xFoldBal } = useBalance({
    address: USER_ADDRESS,
    token: XFOLD_ADDRESS,
    watch: true,
  });
  let ONE_DECIMAL_XFOLD_BAL = Math.floor(parseFloat(xFoldBal?.formatted) * 10) / 10
  let TWO_DECIMAL_XFOLD_BAL = Math.floor(parseFloat(xFoldBal?.formatted) * 100) / 100

  const { data: ApprovalAmount } = useContractRead({
    address: XFOLD_ADDRESS,
    abi: XFOLD_ABI,
    functionName: "allowance",
    args: [USER_ADDRESS, FOLD_ADDRESS],
    watch: true,
  });
  let anyApprovalAmount: any = ApprovalAmount;

  const {
    config: ApproveConfig,
    error: PrepareApproveError,
    isError: isPrepareErrorApprove,
  } = usePrepareContractWrite({
    address: XFOLD_ADDRESS,
    abi: XFOLD_ABI,
    functionName: "approve",
    args: [FOLD_ADDRESS, USER_INPUT_AMOUNT],
    chainId: 1,
    enabled: parseFloat(DebouncedUserInput[0]) > 0.001,
  });
     if (isPrepareErrorApprove) {
    console.log(PrepareApproveError);
  }
  const {
    data: APPROVEDATA,
    write: approve,
  } = useContractWrite(ApproveConfig);
  const { isLoading: isLoadingApprove } =
    useWaitForTransaction({ hash: APPROVEDATA?.hash });
  const {
    config: BurnConfig,
  } = usePrepareContractWrite({
    address: XFOLD_ADDRESS,
    abi: XFOLD_ABI,
    functionName: "burn",
    args: [USER_ADDRESS, USER_INPUT_AMOUNT],
    chainId: 1,
    enabled: parseFloat(DebouncedUserInput[0]) > 0.001,
  });
  const {
    data: BURNDATA,
    write: burn,
  } = useContractWrite(BurnConfig);
  const { isLoading: isLoadingBurn } =
    useWaitForTransaction({ hash: BURNDATA?.hash });

  if (parseFloat(USER_INPUT_AMOUNT) <= parseFloat(anyApprovalAmount)) { //burn
    return (
      <>
        <div className="bg-blackish pb-2 pt-4 font-proxima border-dark-700 rounded-[14px] border border-fresh p-3 gap-4 text-white">
          <label className="text-2xl flex justify-center pb-10">
            Withdraw FOLD
          </label>
          <div className="p-2 mb-1 flex justify-between px-1.5">
            <div className="inline-flex relative items-center py-2 pr-3 pl-2 mr-2 space-x-2 ring-1 ring-fresh text-lg leading-6 rounded-xl shrink-0 cursor-default">
              <Image
                className="w-6 h-6 rounded-full"
                src={xfoldlogo}
                width={24}
                height={24}
              />
              <p className="block font-medium"> FOLD </p>
            </div>
            <input
              className="bg-transparent appearance-none border-none focus:ring-none focus:border-none after:border-none text-left text-2xl flex font-proxima w-full h-10 focus:outline-none text-white p-2"
              inputMode="decimal"
              pattern="^[0-9]*[.,]?[0-9]*$"
              value={UserInput}
              placeholder="0.0"
              required={true}
              onChange={(e) => {
                parseUserInput(e);
              }}
              minLength={1}
              maxLength={79}
              spellCheck="false"
              disabled={isHydrated && !isConnected}
            />
            <div className="shrink-0 space-x-1 inline-flex pt-1 relative items-center">
              {isHydrated && (
                <p className="text-gray-300">
                  Balance: {ONE_DECIMAL_XFOLD_BAL >= 100 ? ONE_DECIMAL_XFOLD_BAL : TWO_DECIMAL_XFOLD_BAL}
                </p>
              )}
              <button
                className="text-indigo-500 focus:outline-none focus:underline hover:underline"
                onClick={() => ONE_DECIMAL_XFOLD_BAL >= 100 ? setUserInput(ONE_DECIMAL_XFOLD_BAL.toString()) : setUserInput(TWO_DECIMAL_XFOLD_BAL.toString()) }
              >
                (Max)
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-4">
          <button
            className="text-white font-medium hover:text-white border border-fresh hover:bg-fresh rounded-lg text-base px-5 py-3.5 text-center mb-2 w-full"
            disabled={
              isLoadingApprove ||
              parseFloat(UserInput) < 0.01
            }
            onClick={() => {
              isConnected ? burn?.() : OpenWalletModal();
            }}
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {isLoadingBurn ? (
              <p> Withdrawing... </p>
            ) : parseFloat(UserInput) >
            TWO_DECIMAL_XFOLD_BAL ? (
              <p> Amount exceeds balance </p>
            ) : parseFloat(UserInput) > 0 ? (
              <p> Withdraw </p>
            ) : parseFloat(UserInput) < 0.01 ? (
              <p> Minimum amount is 0.01 </p>
            ) : isHydrated && !isConnected ? (
              <p> Connect Wallet </p>
            ) : (
              <p> Enter an amount </p>
            )}
          </button>
        </div>
        {isLoadingBurn && (
          <div className="toast">
            <div className="alert bg-fresh border font-medium border-blackish py-4 px-9 text-almostwhite">
              <div>
                <p>Withdrawing...</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  return ( //approve
    <>
      <div className="bg-blackish pb-2 pt-4 font-proxima border-dark-700 rounded-[14px] border border-fresh p-3 gap-4 text-white">
        <label className="text-2xl flex justify-center pb-10">
          Withdraw FOLD
        </label>
        <div className="p-2 mb-1 flex justify-between px-1.5">
          <div className="inline-flex relative items-center py-2 pr-3 pl-2 mr-2 space-x-2 ring-1 ring-fresh text-lg leading-6 rounded-xl shrink-0 cursor-default">
            <Image
              className="w-6 h-6 rounded-full"
              src={xfoldlogo}
              width={24}
              height={24}
            />
            <p className="block font-medium"> FOLD </p>
          </div>
          <input
            className="bg-transparent appearance-none border-none focus:ring-none focus:border-none after:border-none text-left text-2xl flex font-proxima w-full h-10 focus:outline-none text-white p-2"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            value={UserInput}
            placeholder="0.0"
            required={true}
            onChange={(e) => {
              parseUserInput(e);
            }}
            minLength={1}
            maxLength={79}
            spellCheck="false"
            disabled={isHydrated && !isConnected}
          />
          <div className="shrink-0 space-x-1 inline-flex pt-1 relative items-center">
            {isHydrated && (
              <p className="text-gray-300">
                Balance: {ONE_DECIMAL_XFOLD_BAL >= 100 ? ONE_DECIMAL_XFOLD_BAL : TWO_DECIMAL_XFOLD_BAL}
              </p>
            )}
            <button
              className="text-indigo-500 focus:outline-none focus:underline hover:underline"
              onClick={() => ONE_DECIMAL_XFOLD_BAL >= 100 ? setUserInput(ONE_DECIMAL_XFOLD_BAL.toString()) : setUserInput(TWO_DECIMAL_XFOLD_BAL.toString())}
            >
              (Max)
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center pt-4">
        <button
          className="text-white font-medium hover:text-white border border-fresh hover:bg-fresh rounded-lg text-base px-5 py-3.5 text-center mb-2 w-full"
          disabled={
            isLoadingApprove ||
            parseFloat(UserInput) < 0.01
          }
          onClick={() => {
            isConnected ? approve?.() : OpenWalletModal();
          }}
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {isLoadingApprove ? (
            <p> Approving... </p>
          ) : parseFloat(UserInput) > 0.01 ? (
            <p> Approve </p>
          ) : parseFloat(UserInput) < 0.01 ? (
            <p> Minimum amount is 0.01 </p>
          ) : isHydrated && !isConnected ? (
            <p> Connect Wallet </p>
          ) : (
            <p> Enter an amount </p>
          )}
        </button>
      </div>
      {isLoadingApprove && (
        <div className="toast">
          <div className="alert bg-fresh font-medium border border-blackish py-4 px-9 text-almostwhite">
            <div>
              <p>Approving...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}