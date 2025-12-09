//UMI = Universal Metaplex Interface
// Metaplex = „silnik NFT na Solanie”

// Dzięki Metaplexowi nie musisz pisać wszystkich smart kontraktów samodzielnie — dostajesz gotowe, sprawdzone rozwiązania.

// Co dokładnie robi Metaplex?
// 🔧 1. Dostarcza standardy NFT

// Na Solanie wszystkie prawdziwe NFT są zgodne ze standardem Metaplex Token Metadata.
// To opis struktury danych: nazwa, opis, obraz, atrybuty.

// 📚 2. Dostarcza biblioteki (SDK)

// Np.:

// @metaplex-foundation/js – najpopularniejsze SDK do tworzenia NFT w TypeScript.

// @metaplex-foundation/mpl-token-metadata – bezpośrednia obsługa programu on-chain.

// Pozwalają:

// mintować NFT,

// aktualizować metadane,

// uploadować pliki do Arweave lub IPFS,

// tworzyć kolekcje, candy machine, edycje itp.

// 🧱 3. Dostarcza on-chain programy

// To smart kontrakty działające na Solanie, m.in.:

// Token Metadata Program – serce NFT na Solanie

// Candy Machine – narzędzie do masowego mintowania (popularne w kolekcjach 10k)

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
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  keypairIdentity,
  percentAmount,
  signerIdentity,
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

const collectionMint = generateSigner(umi);

const transaction = await createNft(umi, {
  mint: collectionMint,
  name: "myCollection",
  symbol: "MC",
  uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-collection-offchain-data.json",
  sellerFeeBasisPoints: percentAmount(0),
  isCollection: true,
});

const txSig = await transaction.sendAndConfirm(umi); // --- zmiana: zapis sygnatury transakcji
console.log("Transaction confirmed, signature:", txSig); // --- zmiana: log sygnatury

await new Promise((r) => setTimeout(r, 2000)); // --- zmiana: krótka pauza, aby mint pojawił się on-chain

const createdCollectionNft = await fetchDigitalAsset(
  umi,
  collectionMint.publicKey
);

console.log(
  `created Collection 🐗🦓🐹! Address is ${getExplorerLink(
    "address",
    createdCollectionNft.mint.publicKey,
    "devnet"
  )}`
);
