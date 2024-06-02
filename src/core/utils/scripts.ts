import {
  applyParamsToScript,
  SpendingValidator,
  Lucid,
  WithdrawalValidator,
  applyDoubleCBOREncoding,
  Script,
  ScriptType,
  NativeScript,
  nativeScriptFromJson,
} from "lucid-cardano";
import {
  rewardAddress,
  interestValidatorCBOR,
  collateralValidatorCBOR,
  loanValidatorCBOR,
} from "../constants.js";
import { CBORHex } from "../global.types.js";

export function bytesToScript(bytes: CBORHex, type: ScriptType = "PlutusV2") {
  const script: Script = {
    type: type,
    script: bytes,
  };
  return script;
}

export async function registerStakeKey(lucid: Lucid) {
  const rewardAddress = await lucid.wallet.rewardAddress();

  const tx = await lucid
    .newTx()
    .registerStake(rewardAddress as string)
    .complete();

  const signedTx = await tx.sign().complete();

  await signedTx.submit();
}

export function buildMultisigScript(pubKeyHashes: string[], required: number) {
  const nativeScript: NativeScript = {
    required: required,
    type: "atLeast",
    scripts: pubKeyHashes.map((hash) => ({
      type: "sig",
      keyHash: hash,
    })),
  };
  return {
    nativeScript: nativeScript,
    script: nativeScriptFromJson(nativeScript).script,
  };
}

export async function deployCollateralStakingValidator(lucid: Lucid) {
  const { collateralRewardAddress } = await getValidators(lucid);
  const tx = await lucid
    .newTx()
    .registerStake(collateralRewardAddress)
    .complete();
  const signedTx = await tx.sign().complete();
  await signedTx.submit();
}

export async function deployLoanStakingValidator(lucid: Lucid) {
  const { loanRewardAddress } = await getValidators(lucid);
  const tx = await lucid.newTx().registerStake(loanRewardAddress).complete();
  const signedTx = await tx.sign().complete();
  await signedTx.submit();
}

export async function getValidators(lucid: Lucid) {
  const credential = lucid.utils.stakeCredentialOf(rewardAddress);

  const interestValidator = bytesToScript(interestValidatorCBOR);
  const interestValidatorHash =
    lucid.utils.validatorToScriptHash(interestValidator);
  const interestScriptAddress = lucid.utils.validatorToAddress(
    interestValidator,
    credential
  );

  const collateralValidator: SpendingValidator = {
    type: "PlutusV2",
    script: applyDoubleCBOREncoding(
      applyParamsToScript(collateralValidatorCBOR, [interestValidatorHash])
    ),
  };
  const collateralStakingValidator: WithdrawalValidator = {
    type: "PlutusV2",
    script: collateralValidator.script,
  };
  const collateralValidatorHash =
    lucid.utils.validatorToScriptHash(collateralValidator);

  const loanValidator: SpendingValidator = {
    type: "PlutusV2",
    script: applyDoubleCBOREncoding(
      applyParamsToScript(loanValidatorCBOR, [collateralValidatorHash])
    ),
  };
  const loanStakingValidator: WithdrawalValidator = {
    type: "PlutusV2",
    script: loanValidator.script,
  };

  const collateralScriptAddress = lucid.utils.validatorToAddress(
    collateralValidator,
    credential
  );
  const collateralRewardAddress = lucid.utils.validatorToRewardAddress(
    collateralStakingValidator
  );

  const loanRewardAddress =
    lucid.utils.validatorToRewardAddress(loanStakingValidator);
  const loanScriptAddress = lucid.utils.validatorToAddress(
    loanValidator,
    credential
  );

  return {
    collateralValidator,
    collateralStakingValidator,
    collateralRewardAddress,
    collateralScriptAddress,
    loanValidator,
    loanStakingValidator,
    loanRewardAddress,
    loanScriptAddress,
    interestValidator,
    interestScriptAddress,
  };
}
