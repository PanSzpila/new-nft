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

// --- zmiana: konwertuj mint.publicKey na web3.js PublicKey przed użyciem connection.getAccountInfo
const web3MintPubkey = new PublicKey(mint.publicKey); // <-- tutaj konwersja
// --- koniec zmiany

// --- zmiana: czekaj aż konto mint pojawi się on-chain (polling)
// Reason: tx może być dopiero 'processed'/'confirmed' i konto jeszcze nie widoczne dla fetchDigitalAsset
const MAX_WAIT_SEC = 20;
let accountInfo = await connection.getAccountInfo(web3MintPubkey); // używamy web3PublicKey
let waited = 0;
while (!accountInfo && waited < MAX_WAIT_SEC) {
  await new Promise((r) => setTimeout(r, 1000));
  waited += 1;
  accountInfo = await connection.getAccountInfo(web3MintPubkey);
  console.log(`Waiting for mint account to appear... ${waited}s`);
}
if (!accountInfo) {
  throw new Error(
    `Mint account not found after ${MAX_WAIT_SEC}s. Transaction may be unconfirmed or failed. Check tx on explorer.`
  );
}
// --- koniec zmiany

await new Promise((r) => setTimeout(r, 2000)); // --- zmiana: krótka pauza, aby mint pojawił się on-chain

const createdNft = await fetchDigitalAsset(umi, mint.publicKey);

console.log(
  `created NFT 🐹! Address is ${getExplorerLink(
    "address",
    createdNft.mint.publicKey,
    "devnet"
  )}`
);
