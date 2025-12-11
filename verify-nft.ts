// https://youtu.be/amAq-WHAFs8?si=m7LjKhWXN_ZgqrLO&t=15659

import {
  findMetadataPda,
  mplTokenMetadata,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));

const user = await getKeypairFromFile();

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user", user.publicKey.toBase58());

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("set up Umi instance for User");

const collectionAddress = publicKey(
  "GboajDxq5hu1sAiprLi96nUWrMUgaDUe5wYL9RMhVMnk"
);

const nftAddress = publicKey("AsvUn6VGyygdgfGwBoB3ha5TLLNsnz1XhJxCpXdDQaxu");

const transaction = await verifyCollectionV1(umi, {
  metadata: findMetadataPda(umi, { mint: nftAddress }),
  collectionMint: collectionAddress,
  authority: umi.identity,
});

transaction.sendAndConfirm(umi);

console.log(
  `🕸️🕷️👀 NFT${nftAddress} verified as a mamber od collection ${collectionAddress}. See Explorer at ${getExplorerLink(
    "address",
    nftAddress,
    "devnet"
  )}`
);
