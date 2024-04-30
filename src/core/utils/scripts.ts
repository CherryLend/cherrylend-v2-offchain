import {
  applyParamsToScript,
  SpendingValidator,
  Lucid,
  WithdrawalValidator,
  applyDoubleCborEncoding,
} from "lucid-cardano";
import { getLucid } from "./utils.js";

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
  console.log(await signedTx.submit());
}

export async function getValidators() {
  const lucid = await getLucid();

  const interestValidatorCBOR =
    "59012701000032323232323223232232253330073322323300100100322533300e00114a0264a66601866e3cdd718080010020a511330030030013010001375860166018601860186018601860186018601860126ea8c02cc024dd50009bae300b300c300c300c300c3009375400c29309b2b2999802980198031baa00113232533300a300c002149858dd6980500098039baa00116325333004300230053754006264646464646464646464a66602260260042646493180600218058038b1bae30110013011002300f001300f002375a601a002601a004601600260160046eb4c024004c018dd50018b12999802180118029baa001132323232533300b300d002149858dd7180580098058011bae3009001300637540022c6e1d20005734aae7555cf2ab9f5742ae881";
  const collateralValidatorCBOR =
    "59131a010000323232323232323232323232323232322322232533333301500215323233300f3001301137540082a6602092012052756e6e696e672032206172672076616c696461746f7220776974686472617700132533301032533233012300130143754004264a666026600a602a6ea80044c94ccc050c01cc058dd500089991919191919191919191919191919191919119180d1801998029999911119198008008029129998190008a5eb804c8c94ccc0c0c08cc0c8dd500089980200200109981a981b18199baa00133004004002325333030301f303237540022646464646464a66606ca66606c66e1cdd6980d181c9baa00d375a603260726ea801454ccc0d800854ccc0d8004400c5280a5014a02980103d87a8000130213303b30213303b30193039375400a66076603660726ea8014cc0ecc054c0e4dd50029981d980c181c9baa0053303b30163039375400a97ae04bd7019191980080080611299981e0008a5013253330393371e6eb8c0fc008010528899801801800981f8009bae303b303c303c303c303c303c303c303c303c303c303c3038375400866e20c94ccc0d4c0a0c0dcdd500089bad303b303837540022a6606c0602c6030606e6ea8c060c0dcdd500519b80375a6074607660766076607660766076606e6ea800cdd6981d181d981d981d981d981d981b9baa0033370e6eb4c060c0d8dd50051bad301230363754004a666064604860686ea80044c94ccc0dc00454cc0d00c0584c8c94ccc0e400454cc0d80c8584c8c94ccc0ec00454cc0e00d0584c8c94ccc0f400454cc0e80d8584c8c94ccc0fc00454cc0f00e0584c8c94ccc10400454cc0f80e8584c8c94ccc10c00454cc1000f0584c8c94ccc11400454cc1080f8584c8c94ccc11c00454cc110100584c8c94ccc12400454cc118108584c8c94ccc12c00454cc120110584c94ccc130c13c0084c8c8c9263303600f04733035012046330340130451533049045163253333330500011533049045161533049045161533049045161533049045161375c002609a002609a00464a66666609c0022a6608e0862c2a6608e0862c2a6608e0862c26eb400454cc11c10c58c12c004c12c008c94cccccc13000454cc1141045854cc1141045854cc114104584dd68008a998228208b182480098248011929999998250008a9982181f8b0a9982181f8b0a9982181f8b0a9982181f8b09bae00130470013047002325333333048001153304103d16153304103d16153304103d161375a0022a6608207a2c608a002608a00464a66666608c0022a6607e0762c2a6607e0762c2a6607e0762c26eb400454cc0fc0ec58c10c004c10c008c94cccccc110004400454cc0f40e45854cc0f40e45854cc0f40e45854cc0f40e458c104004c104008c94cccccc10800454cc0ec0dc5854cc0ec0dc5854cc0ec0dc584dd68008a9981d81b8b181f800981f80119299999982000088008a9981c81a8b0a9981c81a8b0a9981c81a8b0a9981c81a8b181e800981e80119299999981f00088008a9981b8198b0a9981b8198b0a9981b8198b0a9981b8198b181d800981d80119299999981e0008a9981a8188b0a9981a8188b0a9981a8188b09bad0011533035031163039001303537540022a6606605e2ca66666607200220022a6606405c2c2a6606405c2c2a6606405c2c2a6606405c2c606c60666ea800454cc0c524015b65787065637420496e6c696e65446174756d28636f6c6c61746572616c5f646174756d29203d0a2020202020202020696e7075745f66726f6d5f636f6c6c61746572616c5f76616c696461746f722e6f75747075742e646174756d0016301630323754602860646ea8c0d4008c0d4004cc038dd6180618159baa300c302b375403a464a666054603a60586ea80044cdc78021bae3030302d37540022940c034c0b0dd5180698161baa300e302c37540026466600200200498106d8799f0000ff00222533302f00210011333003003303200232301733031375066e00dd6980818179baa002375a6020605e6ea8004cc0c4dd419b80375a6022605e6ea8008dd6980898179baa0014bd7018061818801180418159baa300c302b375403a6eb0c01cc0acdd5180618159baa01d323300100100222533302e00114bd7009981799192999816180d98171baa001132323232301b330353014303337540026606a602a60666ea800ccc0d4c054c0ccdd50009981a980c98199baa0033303530123033375400697ae030100053301600102d53333330350011001153302e02c16153302e02c16153302e02c16153302e02c163032302f37540022a6605a0542c6024605c6ea8004c0c0004cc008008c0c4004cc034dd6180718151baa300b302a3754038464a666052603860566ea80044cdc78101bae302f302c37540022940c030c0acdd5180618159baa001300100122533302a0011480004cdc02400466004004605a0026002002444a6660520022004266600600664646600200200844a666058002297ae013232533302a3375e00400a200226605e004660080080026060004605c0026056002605800246050605260526052605260526052605260520024604e6050605060506050605060506050002464a666042602060466ea80044c8c8c94ccc090cdd7980498139baa002300d302737540042646020660546ea0cdc08009bad300c30283754006660546ea0cdc08009bad30093028375400697ae033300e37566012604e6ea8014dd7180418139baa3009302737540046eb8c024c09cdd5180498139baa0021300f33029375066601c6eacc024c09cdd50029bae3008302737546012604e6ea8008dd7180498139baa300930273754004660526ea0ccc038dd5980498139baa005375c6010604e6ea8c034c09cdd50011bae300930273754601a604e6ea80092f5c066016002044a66666605400220022a660460422c2a660460422c2a660460422c2a660460422c604e60486ea800454cc08807c58c01cc08cdd500091812981318131813181300091812181298129812981298129812981298129812800918118009181118118009119198008008019129998110008a5eb804c8c94ccc080c0140084cc094008cc0100100044cc010010004c098008c0900048c080c084c084004894ccc068c030c070dd5001099299980f8008a9980e0010b0991929998108008a9980f0020b0991929998118008a998100030b0991929998128008a998110040b0991929998138008a998120050b099299981418158010991924c660220080186602000e0162a6604a0162c64a6666660580022a6604a0162c2a6604a0162c2a6604a0162c2a6604a0162c26eb8004c0a4004c0a4008c94cccccc0a8004400454cc08c0245854cc08c0245854cc08c0245854cc08c02458c09c004c09c008c94cccccc0a000454cc08401c5854cc08401c5854cc08401c584dd68008a998108038b1812800981280119299999981300088008a9980f8028b0a9980f8028b0a9980f8028b0a9980f8028b181180098118011929999998120008a9980e8018b0a9980e8018b0a9980e8018b09bad001153301d003163021001301d37540042a660360022c4603c603e603e603e00244464a666034601a60386ea8004520001375a6040603a6ea8004c94ccc068c034c070dd50008a6103d87a80001323300100137566042603c6ea8008894ccc080004530103d87a80001323232533301f3371e00e6eb8c08400c4c028cc090dd4000a5eb804cc014014008dd6981080118120011811000991980080080211299980f8008a6103d87a80001323232533301e3371e00e6eb8c08000c4c024cc08cdd3000a5eb804cc014014008dd59810001181180118108009ba548000894ccc058c020c060dd5001099299980d8008a9980c0010b09919299980e8008a9980d0020b099299980f18108010a4c2a6603600a2c64a6666660440022a6603600a2c2a6603600a2c2a6603600a2c2a6603600a2c26eb8004c07c004c07c008c94cccccc08000454cc06400c5854cc06400c5854cc06400c5854cc06400c584dd7000980e800980c9baa002153301700116375c6034602e6ea800454cc05404058c064c058dd50008a9980a0078b180c180a9baa002370e90020a9980924815865787065637420536372697074436f6e74657874207b207472616e73616374696f6e3a205f74782c20707572706f73653a20576974686472617746726f6d287374616b655f6372656429207d203d0a2020202020206374780016301630173013375400a2930a99808a491856616c696461746f722072657475726e65642066616c7365001365653333330170051533010008161533010008161533010008161375a00a2a660200102c2a660209211d52756e6e696e672033206172672076616c696461746f72207370656e64001332322322533301432323253330173322323300100100322533301f00114a0264a66603866e3cdd718110010020a5113300300300130220013758603a603c603c603c603c603c603c603c603c60346ea8c008c068dd50021bae3003301a375401020022940cdc419b80375a6038603a603a603a603a603a60326ea801cdd6980e180e980e980e980e980e980e980c9baa007325333017300a3019375400226eb4c074c068dd50008a9980c0090b1800980c9baa300130193754600460326ea8c004c064dd50019180e0009180d980e180e180e180e180e180e180e0008a4c2a6602a9211856616c696461746f722072657475726e65642066616c73650013656533333301a001153301300b16153301300b16153301300b161375a0022a660260162c64a666022600660266ea80084c94ccc05800454cc04c030584c8c94ccc06000454cc054038584c8c94ccc06800454cc05c040584c8c94ccc07000454cc064048584c8c94ccc07800454cc06c050584c8c94ccc08000454cc074058584c8c94ccc08800454cc07c060584c8c94ccc09000454cc084068584c8c94ccc09800454cc08c070584c8c94ccc0a000454cc094078584c8c94ccc0a800454cc09c080584c94ccc0acc0b80084c8c8c9263301900f023330180120223301701302115330280211632533333302f0011533028021161533028021161533028021161533028021161375c0026058002605800464a66666605a0022a6604c03e2c2a6604c03e2c2a6604c03e2c26eb400454cc09807c58c0a8004c0a8008c94cccccc0ac00454cc0900745854cc0900745854cc090074584dd68008a9981200e8b181400098140011929999998148008a9981100d8b0a9981100d8b0a9981100d8b0a9981100d8b09bae001302600130260023253333330270011533020019161533020019161533020019161375a0022a660400322c6048002604800464a66666604a0022a6603c02e2c2a6603c02e2c2a6603c02e2c26eb400454cc07805c58c088004c088008c94cccccc08c004400454cc0700545854cc0700545854cc0700545854cc07005458c080004c080008c94cccccc08400454cc06804c5854cc06804c5854cc06804c584dd68008a9980d0098b180f000980f00119299999980f80088008a9980c0088b0a9980c0088b0a9980c0088b0a9980c0088b180e000980e00119299999980e80088008a9980b0078b0a9980b0078b0a9980b0078b0a9980b0078b180d000980d00119299999980d8008a9980a0068b0a9980a0068b0a9980a0068b09bad001153301400d163018001301437540042a660240162c44a666024600860286ea80084c94ccc05c00454cc050008584c8c94ccc06400454cc058010584c94ccc068c07400852615330170051632533333301e0011533017005161533017005161533017005161533017005161375c0026036002603600464a6666660380022a6602a0062c2a6602a0062c2a6602a0062c2a6602a0062c26eb8004c064004c054dd50010a998098008b299999980b80288028a998080048b0a998080048b0a998080048b0a998080048b180a98091baa004370e90001b874800854cc0380045854cc0380045854cc0380045854cc0380045924191496e636f72726563742072656465656d6572207479706520666f722076616c696461746f72207370656e642e0a2020202020202020202020202020202020202020446f75626c6520636865636b20796f7520686176652077726170706564207468652072656465656d657220747970652061732073706563696669656420696e20796f757220706c757475732e6a736f6e00375c0029210e5f72656465656d65723a20496e7400490116646174756d3a20436f6c6c61746572616c446174756d004901396578706563742046696e697465286c6f7765725f626f756e6429203d2072616e67652e6c6f7765725f626f756e642e626f756e645f747970650049014765787065637420496e6c696e652853637269707443726564656e7469616c28636f6c6c61746572616c5f76616c696461746f725f686173682929203d207374616b655f637265640049014165787065637420636f6c6c61746572616c5f646174756d5f74797065643a20436f6c6c61746572616c446174756d203d20636f6c6c61746572616c5f646174756d0049013165787065637420496e6c696e65446174756d28696e7465726573745f646174756d29203d206f75747075742e646174756d0049013b65787065637420696e7465726573745f646174756d5f74797065643a20496e746572657374446174756d203d20696e7465726573745f646174756d005734ae7155ceaab9e5573eae815d0aba257481";
  const loanValidatorCBOR =
    "5915da01000032323232323232323232323232323232232223253333330150021532323233301030013012375400a2a6602292012052756e6e696e672032206172672076616c696461746f7220776974686472617700132533301132533233013300130153754004264a666028600a602c6ea80044c94ccc054c01cc05cdd50008999191919191919191919191919191919119180c1801998029919980080080125eb808894ccc0b800840044ccc00c00cc0c4008c8c94ccc0b0c068c0b8dd50008991919192999818181098191baa00113233036302433036375066e00dd69809181a1baa0013330143756602660686ea801cdd71809181a1baa3013303437540086eb8c04cc0d0dd51809981a1baa004330363013303437540086606c6ea0cdc01bad3011303437540086eb4c044c0d0dd50009981b180a981a1baa00433036375066e00dd6980b181a1baa004375a602c60686ea8004cc0d8c060c0d0dd50021981b180b981a1baa00433036301a3034375400897ae03301b00823330323371e6eb8c06cc0d4dd50009bae30183035375400a94128981b18199baa00113303530233303537506660266eacc048c0ccdd50031bae301130333754602460666ea800cdd7180918199baa3012303337540066606a602460666ea800ccc0d4c040c0ccdd50019981a980a18199baa003330353015303337540066606a602e60666ea800ccc0d4c058c0ccdd50019981a980c98199baa0034bd70003991980080080391299981a8008a60103d87a800013232533303353330333371e6eb8c070c0d8dd50011bae30193036375400c2a66606666ebcc054c0d8dd5001180a981b1baa006153330333375e602e606c6ea8008c05cc0d8dd50030a99981999baf301a303637540046034606c6ea80184cdc39bad3019303637540046eb4c070c0d8dd50030a5014a02940528098131981c00125eb804cc010010004c0e4008c0dc004cc0580040b14cccccc0d4004400454cc0b80ac5854cc0b80ac5854cc0b80ac5854cc0b80ac58c0c8c0bcdd50008a99816a493365787065637420496e6c696e65446174756d286c6f616e5f6f666665725f646174756d29203d206f75747075742e646174756d0016300b302e37540026018605a6ea8c0c0008cc88c8cc00400400c894ccc0bc00452f5c026464a66605a603e605e6ea80044cc0100100084cc0c8c0ccc0c0dd50009980200200119192999817180e18181baa001132323232533303253330323370e6eb4c0e0c0e4c0e4c0e4c0e4c0e4c0e4c0e4c0e4c0e4c0d4dd50019bad301330353754014200229404c94cc0d124101310013026330380014bd7018129981b9809981a9baa003330373014303537540066606e6ea0ccc054dd5980a181a9baa006375c6026606a6ea8c048c0d4dd50019bae3014303537546024606a6ea800ccc0dcc048c0d4dd50019981b980b181a9baa003330373017303537540066606e6030606a6ea800ccc0dcc064c0d4dd5001a5eb8054cc0cd24101300014c103d87a80003370e6eb4c0dcc0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0d0dd50011bad301330343754012a666060604260646ea80044c94ccc0d400454cc0c80c0584c8c94ccc0dc00454cc0d00c8584c8c94ccc0e400454cc0d80d0584c8c94ccc0ec00454cc0e00d8584c8c94ccc0f400454cc0e80e0584c8c94ccc0fc00454cc0f00e8584c8c94ccc10400454cc0f80f0584c8c94ccc10c00454cc1000f8584c8c94ccc11400454cc108100584c8c94ccc11c00454cc110108584c8c94ccc12400454cc118110584c94ccc128c1340084c8c8c9263303300f047330320120463303101304515330470451632533333304e0011533047045161533047045161533047045161533047045161375c0026096002609600464a6666660980022a6608a0862c2a6608a0862c2a6608a0862c26eb400454cc11410c58c124004c124008c94cccccc12800454cc10c1045854cc10c1045854cc10c104584dd68008a998218208b182380098238011929999998240008a9982081f8b0a9982081f8b0a9982081f8b0a9982081f8b09bae00130450013045002325333333046001153303f03d16153303f03d16153303f03d161375a0022a6607e07a2c6086002608600464a6666660880022a6607a0762c2a6607a0762c2a6607a0762c26eb400454cc0f40ec58c104004c104008c94cccccc108004400454cc0ec0e45854cc0ec0e45854cc0ec0e45854cc0ec0e458c0fc004c0fc008c94cccccc10000454cc0e40dc5854cc0e40dc5854cc0e40dc584dd68008a9981c81b8b181e800981e80119299999981f00088008a9981b81a8b0a9981b81a8b0a9981b81a8b0a9981b81a8b181d800981d80119299999981e00088008a9981a8198b0a9981a8198b0a9981a8198b0a9981a8198b181c800981c80119299999981d0008a998198188b0a998198188b0a998198188b09bad0011533033031163037001303337540022a6606205e2ca66666606e00220022a6606005c2c2a6606005c2c2a6606005c2c2a6606005c2c606860626ea800454cc0bd24013365787065637420496e6c696e65446174756d28636f6c6c61746572616c5f646174756d29203d206f75747075742e646174756d0016300d3030375400260640046064002660226eb0c01cc0a8dd5180418151baa01c2325333029301b302b3754002266e3c080dd7181798161baa00114a0601260566ea8c024c0acdd50009919199800800801a60106d8799f0000ff00222533302f0021001133300300330320023232533302d301b302f3754002264646460466606a6ea0cdc01bad30113033375400c6660266eacc048c0ccdd5180918199baa005375c602260666ea8c048c0ccdd50011bae301230333754602460666ea8008cc0d4dd419b80375a602460666ea8018dd6980a98199baa0024bd701980b800816299999981b00088008a998178158b0a998178158b0a998178158b0a998178158b181998181baa001153302e4913365787065637420496e6c696e65446174756d286c6f616e5f646174756d29203d20696e7075742e6f75747075742e646174756d0016300c302f3754601c605e6ea8004c0c4008dd6180418151baa3008302a3754038660206eb0c01cc0a4dd5180398149baa01b2325333028301a302a3754002266e3c00cdd7181718159baa00114a0601060546ea8c020c0a8dd5180498151baa00130010012253330290011480004cdc0240046600400460580026002002444a6660500022004266600600664646600200200844a666056002297ae01323253330293375e00400a200226605c00466008008002605e004605a002605400260560024604e605060500024604c0024604a604c00244464a666042602660466ea8004520001375a604e60486ea8004c94ccc084c04cc08cdd50008a6103d87a80001323300100137566050604a6ea8008894ccc09c004530103d87a8000132323253330263371e00e6eb8c0a000c4c064cc0acdd4000a5eb804cc014014008dd698140011815801181480099198008008021129998130008a6103d87a8000132323253330253371e00e6eb8c09c00c4c060cc0a8dd3000a5eb804cc014014008dd598138011815001181400091811981218121812000918111811981198119811800918109811181118111811181118111811000918101810981098109810981080091299980d1805980e1baa002132533301f001153301c00216132325333021001153301e00416132325333023001153302000616132325333025001153302200816132325333027001153302400a16132325333029001153302600c1613232533302b001153302800e1613232533302d001153302a01016132533302e30310021323232498cc05c01c04ccc058028048cc05403404454cc0ac04458c94cccccc0c800454cc0ac0445854cc0ac0445854cc0ac0445854cc0ac044584dd7000981780098178011929999998180008a998148078b0a998148078b0a998148078b09bad001153302900f16302d001302d00232533333302e0011001153302700d16153302700d16153302700d16153302700d16302b001302b00232533333302c001153302500b16153302500b16153302500b161375a0022a6604a0162c6052002605200464a66666605400220022a660460122c2a660460122c2a660460122c2a660460122c604e002604e00464a6666660500022a6604200e2c2a6604200e2c2a6604200e2c26eb400454cc08401c58c094004c094008c94cccccc098004400454cc07c0145854cc07c0145854cc07c0145854cc07c01458c08c004c08c008c94cccccc09000454cc07400c5854cc07400c5854cc07400c584dd68008a9980e8018b1810800980e9baa002153301b001162301e301f301f301f301f301f301f00122323300100100322533301e00114bd7009919299980e1802801099810801198020020008998020020009811001181000091299980b9804180c9baa002132533301c00115330190021613232533301e001153301b00416132533301f3022002149854cc07001458c94cccccc08c00454cc0700145854cc0700145854cc0700145854cc070014584dd7000981000098100011929999998108008a9980d0018b0a9980d0018b0a9980d0018b0a9980d0018b09bae001301e001301a37540042a660300022c6eb8c06cc060dd50008a9980b0080b180d180b9baa001153301500f163019301637540046e1d2004153301349015865787065637420536372697074436f6e74657874207b207472616e73616374696f6e3a205f74782c20707572706f73653a20576974686472617746726f6d287374616b655f6372656429207d203d0a2020202020206374780016301730183014375400c2930a998092491856616c696461746f722072657475726e65642066616c736500136565333333018006153301100c16153301100c16153301100c161375a00c2a660220182c2a660229211d52756e6e696e672033206172672076616c696461746f72207370656e64001332322323225333016325333017300830193754600260346ea80104cc88c8cc00400400c894ccc07c004528099299980e19b8f375c604400400829444cc00c00c004c088004dd6180e980f180f180f180f180f180f180f180f180d1baa3001301a37540046eb8c074c078c078c078c078c078c078c078c068dd50038991919299980d1806180e1baa0011323322323300100100322533302300114a0264a66604066ebc010c088c09800852889980180180098130009bab3021302230223022302230223022001300e330203005301e37546042603c6ea8cc88c8cc00400400c894ccc08c00454cc08124011b657870656374205b696e7075742c202e2e5d203d20696e70757473001613253330203375e601460466ea80040104c098c09cc08cdd5000899801801981380118128009bac30210013021301e375400497ae0301d37540042a6603692014765787065637420536372697074436f6e74657874207b207472616e73616374696f6e3a2074782c20707572706f73653a205370656e64286f776e5f72656629207d203d206374780016301f3020002301e001301a37540044603a0022930a9980ba491856616c696461746f722072657475726e65642066616c736500136565333014300530163754002264a6660320022a6602c01c2c264a666034603a0042649319299980b9804000899299980e0008a9980c8088b099299980e98100010a4c2a660340242c64a6666660420022a660340242c2a660340242c2a660340242c26eb400454cc06804858c078004c068dd50010a99980b9804800899299980e0008a9980c8088b099299980e98100010a4c2a660340242c64a6666660420022a660340242c2a660340242c2a660340242c26eb400454cc06804858c078004c068dd50010a9980c0080b180c1baa001153301700f1632533333301e0011001153301700f16153301700f16153301700f16153301700f16301b001301737540022a6602a01a2ca66666603600220022a660280182c2a660280182c2a660280182c2a660280182c64a666024600660286ea80084c94ccc05c00454cc050034584c8c94ccc06400454cc05803c584c8c94ccc06c00454cc060044584c8c94ccc07400454cc06804c584c8c94ccc07c00454cc070054584c8c94ccc08400454cc07805c584c8c94ccc08c00454cc080064584c8c94ccc09400454cc08806c584c94ccc098c0a40084c8c8c9263301300701e3301200a01d3301100d01c153302301c1632533333302a001153302301c16153302301c16153302301c16153302301c161375c002604e002604e00464a6666660500022a660420342c2a660420342c2a660420342c26eb400454cc08406858c094004c094008c94cccccc098004400454cc07c0605854cc07c0605854cc07c0605854cc07c06058c08c004c08c008c94cccccc09000454cc0740585854cc0740585854cc074058584dd68008a9980e80b0b1810800981080119299999981100088008a9980d80a0b0a9980d80a0b0a9980d80a0b0a9980d80a0b180f800980f8011929999998100008a9980c8090b0a9980c8090b0a9980c8090b09bad001153301901216301d001301d00232533333301e0011001153301701016153301701016153301701016153301701016301b001301b00232533333301c001153301500e16153301500e16153301500e161375a0022a6602a01c2c6032002602a6ea800854cc04c03058894ccc04cc010c054dd5001099299980c0008a9980a8010b09919299980d0008a9980b8020b099299980d980f0010a4c2a6603000a2c64a66666603e0022a6603000a2c2a6603000a2c2a6603000a2c2a6603000a2c26eb8004c070004c070008c94cccccc07400454cc05800c5854cc05800c5854cc05800c5854cc05800c584dd7000980d000980b1baa00215330140011653333330180061006153301100a16153301100a16153301100a16153301100a1630163013375400a6e1d2000370e90011ba54800054cc0380045854cc0380045854cc0380045854cc03800459240191496e636f72726563742072656465656d6572207479706520666f722076616c696461746f72207370656e642e0a2020202020202020202020202020202020202020446f75626c6520636865636b20796f7520686176652077726170706564207468652072656465656d657220747970652061732073706563696669656420696e20796f757220706c757475732e6a736f6e00375c0029211272656465656d65723a2052656465656d657200490115646174756d3a204f666665724c6f616e446174756d0049014165787065637420496e6c696e652853637269707443726564656e7469616c286c6f616e5f76616c696461746f725f686173682929203d207374616b655f637265640049010e5f72656465656d65723a20496e7400490134657870656374206c6f616e5f646174756d5f74797065643a204f666665724c6f616e446174756d203d206c6f616e5f646174756d00490140657870656374206c6f616e5f6f666665725f646174756d5f74797065643a204f666665724c6f616e446174756d203d206c6f616e5f6f666665725f646174756d0049014165787065637420636f6c6c61746572616c5f646174756d5f74797065643a20436f6c6c61746572616c446174756d203d20636f6c6c61746572616c5f646174756d005734ae7155ceaab9e5573eae815d0aba257481";

  const interestValidator = bytesToValidator(interestValidatorCBOR);
  const interestValidatorHash =
    lucid.utils.validatorToScriptHash(interestValidator);
  const interestValidatorAddress =
    lucid.utils.validatorToAddress(interestValidator);

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
    collateralValidator,
    collateralStakingValidator,
    collateralRewardAddress,
    collateralScriptAddress,
    loanValidator,
    loanStakingValidator,
    loanRewardAddress,
    loanScriptAddress,
    interestValidator,
    interestValidatorAddress,
  };
}
