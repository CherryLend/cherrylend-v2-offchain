import {
  applyParamsToScript,
  SpendingValidator,
  Lucid,
  WithdrawalValidator,
  applyDoubleCborEncoding,
  stakeCredentialOf,
} from "lucid-cardano";
import { getLucid } from "./utils/utils.ts";

function bytesToValidator(bytes: string) {
  const script: SpendingValidator = {
    type: "PlutusV2",
    script: bytes,
  };
  return script;
}

export async function deployCollateralStakingValidator(lucid: Lucid) {
  const { collateralRewardAddress } = await getValidators();
  const tx = await lucid
    .newTx()
    .registerStake(collateralRewardAddress)
    .complete();
  const signedTx = await tx.sign().complete();
  await signedTx.submit();
}

export async function deployLoanStakingValidator(lucid: Lucid) {
  const { loanRewardAddress } = await getValidators();
  const tx = await lucid.newTx().registerStake(loanRewardAddress).complete();
  const signedTx = await tx.sign().complete();
  await signedTx.submit();
}

export async function getValidators() {
  const lucid = await getLucid();

  const interestValidatorCBOR =
    "59012701000032323232323223232232253330073322323300100100322533300e00114a0264a66601866e3cdd718080010020a511330030030013010001375860166018601860186018601860186018601860126ea8c02cc024dd50009bae300b300c300c300c300c3009375400c29309b2b2999802980198031baa00113232533300a300c002149858dd6980500098039baa00116325333004300230053754006264646464646464646464a66602260260042646493180600218058038b1bae30110013011002300f001300f002375a601a002601a004601600260160046eb4c024004c018dd50018b12999802180118029baa001132323232533300b300d002149858dd7180580098058011bae3009001300637540022c6e1d20005734aae7555cf2ab9f5742ae881";
  const collateralValidatorCBOR =
    "590901010000323232323232322322253232333007300130083754006264a66601064a66466014600260166ea80084c94ccc02cc014c030dd50008992999806180398069baa00113323232323232323232323232323232323232232301a30033300533332222323300100100522533302900114bd70099192999814181198149baa00113300400400213302c302d302a37540026600800800464a666050603e60526ea80044c8c8c8c8c94ccc0b54ccc0b4cdc39bad3019302f37540186eb4c060c0bcdd50028a9998168010a99981680088018a5014a02940530103d87a800013020330313020330313018302f375400a660626034605e6ea8014cc0c4c050c0bcdd500299818980b98179baa005330313015302f375400a97ae04bd701919198008008059129998190008a5013253330303371e6eb8c0d4008010528899801801800981a8009bae30313032303230323032303230323032303230323032302e375400866e20c94ccc0b0c09cc0b4dd500089bad3031302e37540022c602e605a6ea8c05cc0b4dd500499b80375a6060606260626062606260626062605a6ea800cdd698181818981898189818981898169baa0033370e6eb4c05cc0b0dd50049bad3011302c3754004a666052604660546ea80044c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c94ccc108c1140084c8c8c926303500f3034012303301316375c608600260860046eb4c104004c104008dd6981f800981f8011bae303d001303d002375a607600260760046eb4c0e4004c0e4008c0dc004c0dc008dd6981a800981a80118198009819801181880098188011bad302f001302b37540022c605a60546ea800458c058c0a4dd5180a18149baa302c002302c0013300e3758601860446ea8c030c088dd500e1192999811180e98119baa00113371e0086eb8c09cc090dd50008a50300d30233754601a60466ea8c038c08cdd500099199800800801260106d8799f0000ff00222533302600210011333003003302900232301733028375066e00dd6980818131baa002375a6020604c6ea8004cc0a0dd419b80375a6022604c6ea8008dd6980898131baa0014bd7018061814001180418111baa300c302237540386eb0c01cc088dd5180618111baa01c323300100100222533302500114bd7009981319192999812180d98129baa0011323232301a3302b30133029375400266056602860526ea800ccc0acc050c0a4dd500099815980c18149baa0033302b30113029375400697ae0300f00430150013029302637540022c6024604a6ea8004c09c004cc008008c0a0004cc034dd6180718109baa300b30213754036464a666042603860446ea80044cdc780f9bae3026302337540022940c030c088dd5180618111baa00130010012253330210011480004cdc0240046600400460480026002002444a6660400022004266600600664646600200200844a666046002297ae01323253330223375e00400a200226604c00466008008002604e004604a002604400260460024603e604060406040604060406040604060400024603c603e603e603e603e603e603e603e002464a666032602060346ea80044c8c94ccc06ccdd79804180e9baa002300c301d3754004264601e660406ea0cdc08009bad300b301e3754006660406ea0cdc08009bad3008301e375400697ae033300d37566010603a6ea8010dd71803980e9baa3008301d37540046eb8c020c074dd51804180e9baa0021300e3301f375066601a6eacc020c074dd50021bae3007301d37546010603a6ea8008dd71804180e9baa3008301d37540046603e6ea0ccc034dd59804180e9baa004375c600e603a6ea8c030c074dd50011bae3008301d37546018603a6ea80092f5c06014002603c60366ea800458c01cc068dd50009180e180e980e980e980e8009180d980e180e180e180e180e180e180e180e180e0009180d0009180c980d00091191980080080191299980c8008a5eb804c8c94ccc060c0140084cc070008cc0100100044cc010010004c074008c06c0048c05cc060c06000494ccc044c02cc048dd5000899191919191919191919299980f18108010991924c6020008601e00e2c6eb8c07c004c07c008c074004c074008dd6980d800980d801180c800980c8011bad3017001301337540022c4602a602c602c602c00244464a666024601a60266ea8004520001375a602e60286ea8004c94ccc048c034c04cdd50008a60103d87a80001323300100137566030602a6ea8008894ccc05c004530103d87a8000132323253330173371e00e6eb8c06000c4c028cc06cdd4000a5eb804cc014014008dd6980c001180d801180c800991980080080211299980b0008a6103d87a8000132323253330163371e00e6eb8c05c00c4c024cc068dd3000a5eb804cc014014008dd5980b801180d001180c0009ba54800094ccc034c01cc038dd5000899191919299980a180b8010a4c2c6eb8c054004c054008dd7180980098079baa00116375c6022601c6ea800458c040c034dd50008b180798061baa002370e90020b1806980718051baa00414984d958dd6802099191299980519191929998069991191980080080191299980a0008a5013253330123371e6eb8c05c008010528899801801800980b8009bac301230133013301330133013301330133013300f37546004601e6ea8010dd7180198079baa00a100114a066e20cdc01bad301130123012301230123012300e37540126eb4c044c048c048c048c048c048c048c038dd5004992999806980418071baa0011375a6024601e6ea800458c004c038dd5180098071baa3002300e37546002601c6ea800c8c0440048c040c044c044c044c044c044c044c04400452613656375a601a60146ea8010c94ccc020c008c024dd500289919191919191919191919191919191919191919191929998109812001099191924c603201e6030024602e0262c6eb8c088004c088008dd6981000098100011bad301e001301e002375c603800260380046eb4c068004c068008dd6980c000980c001180b000980b0011bad301400130140023012001301200230100013010002375a601c00260146ea80145894ccc020c008c024dd5000899191919299980798090010a4c2c6eb8c040004c040008dd7180700098051baa00116370e90001b8748008dd7000ab9a5573aaae7955cfaba05742ae89";
  const loanValidatorCBOR =
    "59099d0100003232323232323223222532333006300130073754004264a66600e64a66466012600260146ea80084c94ccc028c014c02cdd5000899299919806180098069baa002133232323232323232323232323232323232232301a300333005323330010010024bd70111299981280108008999801801981400119192999812180e18129baa0011323232533302730223028375400226466058602c660586ea0cdc01bad3013302a375400266602a6eacc050c0a8dd50031bae3013302a3754602860546ea8010dd7180a18151baa3014302a375400866058602860546ea8010cc0b0dd419b80375a602060546ea8010dd6980818151baa0013302c3017302a3754008660586ea0cdc01bad3018302a37540086eb4c060c0a8dd500099816180c98151baa0043302c3012302a375400866058602260546ea80112f5c06603600e466605266e3cdd7180918159baa001375c602660566ea801528251302c30293754002266056602a660566ea0ccc050dd5980998149baa005375c602460526ea8c04cc0a4dd50019bae301330293754602660526ea800ccc0acc04cc0a4dd500199815980798149baa0033302b30163029375400666056602e60526ea800ccc0acc060c0a4dd500199815980898149baa0033302b30103029375400697ae0006323300100100622533302b00114c103d87a800013232533302a533302a3371e6eb8c04cc0b0dd50011bae3014302c375400c2a66605466ebcc058c0b0dd5001180b18161baa0061533302a3375e603260586ea8008c064c0b0dd50030a99981519baf301b302c3754004603660586ea80184cdc39bad3014302c37540046eb4c04cc0b0dd50030a5014a029405280980c1981700125eb804cc010010004c0bc008c0b4004c05c004c0a4c098dd50008b180598129baa001300e30243754604e0046644646600200200644a66604c002297ae0132325333025301a302637540022660080080042660526054604e6ea8004cc010010008c8c94ccc098c078c09cdd50008991919192999815299981519b87375a602660586ea8010c94ccc0acc080c0b0dd500089bad3030302d37540022c602a60586ea8c054c0b0dd5180a18161baa3015302c375404c2a666054004200229405280980c19817180c19817180a98161baa0043302e3016302c37540086605c6ea0ccc05cdd5980b18161baa006375c602a60586ea8c048c0b0dd50021bae3016302c3754602460586ea8010cc0b8c048c0b0dd500219817180c98161baa0043302e301a302c37540086605c602860586ea8010cc0b8c06cc0b0dd500225eb812f5c02980103d87a80003370e6eb4c0b8c0bcc0bcc0bcc0bcc0bcc0bcc0bcc0bcc0acdd50019bad3015302b375401266e1cdd6981698171817181718171817181718171817181718151baa002375a602660546ea80214ccc09cc088c0a0dd500089919191919191919191919191919191919191919191929998201821801099191924c606601e606402460620262c6eb8c104004c104008dd6981f800981f8011bad303d001303d002375c607600260760046eb4c0e4004c0e4008dd6981b800981b801181a800981a8011bad3033001303300230310013031002302f001302f002375a605a00260526ea800458c0acc0a0dd50008b180698139baa00130290023029001330123758600e60426ea8c028c084dd500d9192999810980b18111baa00113371e03e6eb8c098c08cdd50008a50300b30223754601660446ea8004c8c8ccc00400400d300106d8799f0000ff00222533302600210011333003003302900232325333025301d3026375400226464602a660566ea0cdc01bad30123029375400a6660286eacc04cc0a4dd5180998149baa004375c602460526ea8c04cc0a4dd50011bae301330293754602660526ea8008cc0acdd419b80375a602660526ea8014dd6980b98149baa0024bd70180c000981518139baa00116300c302637546020604c6ea8004c0a0008dd6180518109baa300a30213754036660226eb0c024c080dd5180498101baa01a2325333020301530213754002266e3c00cdd7181298111baa00114a0601460426ea8c028c084dd5180598109baa00130010012253330200011480004cdc0240046600400460460026002002444a66603e0022004266600600664646600200200844a666044002297ae01323253330213375e00400a200226604a00466008008002604c0046048002604200260440024603c603e603e0024603a603c603c603c603c603c603c00246038603a603a603a603a603a603a603a0024603600246034603600244464a66602e601860306ea8004520001375a603860326ea8004c94ccc05cc030c060dd50008a60103d87a8000132330010013756603a60346ea8008894ccc070004530103d87a80001323232533301c3371e00e6eb8c07400c4c028cc080dd4000a5eb804cc014014008dd6980e8011810001180f000991980080080211299980d8008a6103d87a80001323232533301b3371e00e6eb8c07000c4c024cc07cdd3000a5eb804cc014014008dd5980e001180f801180e8009ba5480008c05cc060c060c0600048c058c05cc05cc05cc05c0048c054c058c058c058c058c05800494ccc03cc028c040dd500089919191919191919191919191919191929998111812801099191924c602a00e6028014602601a2c6eb8c08c004c08c008dd698108009810801180f800980f8011bad301d001301d002301b001301b002375a60320026032004602e002602e0046eb4c054004c044dd50008b11191980080080191299980a0008a5eb804c8c94ccc04cc0140084cc05c008cc0100100044cc010010004c060008c05800494ccc034c020c038dd5000899191919299980a180b8010a4c2c6eb8c054004c054008dd7180980098079baa00116375c6022601c6ea8008dc3a40042c601e60186ea800458c038c02cdd50011b874801058c030c034c024dd50018a4c26cac6eb400c4c8c894ccc024cc88c8cc00400400c894ccc040004528099299980719b8f375c602600400829444cc00c00c004c04c004dd618071807980798079807980798079807980798059baa300e300b37540026eb8c038c03cc03cc03cc03cc03cc03cc03cc02cdd50030a4c26cac6eb4c030c024dd5001992999803980118041baa004132323232323232323232323232323232533301a301d0021323232498c04c01cc048028c04403458dd7180d800980d8011bad3019001301900230170013017002375a602a002602a004602600260260046eb4c044004c044008c03c004c03c008dd6980680098049baa0041625333007300230083754002264646464a66601c60220042930b1bae300f001300f002375c601a00260126ea800458dc3a40006eb80055cd2ab9d5573caae7d5d02ba157441";

  const interestValidator = bytesToValidator(interestValidatorCBOR);
  const interestValidatorHash =
    lucid.utils.validatorToScriptHash(interestValidator);

  const collateralValidator: SpendingValidator = {
    type: "PlutusV2",
    script: applyDoubleCborEncoding(
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
    script: applyDoubleCborEncoding(
      applyParamsToScript(loanValidatorCBOR, [collateralValidatorHash])
    ),
  };
  const loanStakingValidator: WithdrawalValidator = {
    type: "PlutusV2",
    script: loanValidator.script,
  };

  const collateralScriptAddress =
    lucid.utils.validatorToAddress(collateralValidator);
  const collateralRewardAddress = lucid.utils.validatorToRewardAddress(
    collateralStakingValidator
  );

  const loanRewardAddress =
    lucid.utils.validatorToRewardAddress(loanStakingValidator);
  const loanScriptAddress = lucid.utils.validatorToAddress(loanValidator);

  return {
    interestValidator,
    collateralValidator,
    loanValidator,
    collateralStakingValidator,
    loanStakingValidator,
    loanRewardAddress,
    collateralRewardAddress,
    collateralScriptAddress,
    loanScriptAddress,
  };
}
