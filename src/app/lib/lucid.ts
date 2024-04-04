export async function getLucid() {
  const { Lucid, Blockfrost } = await import("lucid-cardano");
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      process.env.BLOCKFROST_API_KEY
    ),
    "Preprod"
  );
  return lucid;
}
