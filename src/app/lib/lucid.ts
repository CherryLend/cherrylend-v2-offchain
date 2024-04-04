export async function getLucid() {
  const { Lucid, Blockfrost } = await import("lucid-cardano");
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      "preprod5BcMnGu4evMGBBOnHIZ3VxsXIsRQdEwB"
    ),
    "Preprod"
  );
  return lucid;
}
