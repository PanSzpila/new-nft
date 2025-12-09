// https://youtu.be/amAq-WHAFs8?si=oZBxZKtaD2hdE_5o&t=14975

import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  keypairIdentity,
  percentAmount,
  generateSigner,
} from "@metaplex-foundation/umi";

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

const collectionAddress = new PublicKey(
  "GboajDxq5hu1sAiprLi96nUWrMUgaDUe5wYL9RMhVMnk"
);

console.log(`Creating NFT...`);

const mint = generateSigner(umi);

const transaction = await createNft(umi, {
  mint,
  name: "My NFT",
  uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-offchain-data.json",
  sellerFeeBasisPoints: percentAmount(0),
  collection: {
    key: collectionAddress,
    verified: false,
  },
});

const txSig = await transaction.sendAndConfirm(umi); // --- zmiana: zapis sygnatury transakcji
console.log("Transaction confirmed, signature:", txSig); // --- zmiana: log sygnatury

await new Promise((r) => setTimeout(r, 2000)); // --- zmiana: krótka pauza, aby mint pojawił się on-chain

const createdNft = await fetchDigitalAsset(umi, mint.publicKey);

console.log(
  `created NFT 🐹! Address is ${getExplorerLink(
    "address",
    createdNft.mint.publicKey,
    "devnet"
  )}`
);
