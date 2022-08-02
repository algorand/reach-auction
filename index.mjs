// Import and instance of the reach stdlib
import { loadStdlib } from '@reach-sh/stdlib';
// The following line is crucial to connect to the backend
import * as backend from './build/index.main.mjs';

const stdlib = loadStdlib();
  // Each participant is given a balance of 100 algos. Parse the native currency and return a balance
const startingBalance = stdlib.parseCurrency(100);

console.log(`Creating test account for Creator`);
const accCreator = await stdlib.newTestAccount(startingBalance);

console.log(`Having creator create testing NFT`);
// Create an NFT.
const theNFT = await stdlib.launchToken(accCreator, "bumple", "NFT", { supply: 1 });
const nftId = theNFT.id;
const minBid = stdlib.parseCurrency(2);
const lenInBlocks = 10;
const params = { nftId, minBid, lenInBlocks };
// Establish done as a let, rather than a const so that the boolean 
// is able to mutate to true when it is time to exit the parallelReduce
let done = false;
const bidders = [];
// Create startBidders(), a function that will be triggered by auctionReady()
const startBidders = async () => {
    // Store the value in minBid as bid. This value is also mutable 
    // so that the bid value can be updated as bidders race for the NFT
    let bid = minBid;
    // Create the runBidder() function, which will be called 
    // when API Participants place a bid
    const runBidder = async (who) => {
        const inc = stdlib.parseCurrency(Math.random() * 10);
        bid = bid.add(inc);
        // Initialize a new account with devnet tokens
        const acc = await stdlib.newTestAccount(startingBalance);
        // Set the account address as a distinguishing label in debug logs
        acc.setDebugLabel(who);
        // Return a promise when the NFT is ready to be accepted by the contract
        await acc.tokenAccept(nftId);
        // Using standard JavaScript, this statement pushes the bidder 
        // and their account to the bidders array.
        bidders.push([who, acc]);
        // Attach the API Participant to the contract
        const ctc = acc.contract(backend, ctcCreator.getInfo());
        // Store the balance of the Bidder in getBal
        const getBal = async () => stdlib.formatCurrency(await stdlib.balanceOf(acc));

        console.log(`${who} decides to bid ${stdlib.formatCurrency(bid)}.`);
        console.log(`${who} balance before is ${await getBal()}`);
        try {
            // Store the Bidder's address and bid amount in a constant
            const [ lastBidder, lastBid ] = await ctc.apis.Bidder.bid(bid);
            // Print a message stating who has been outbid and for how much
            console.log(`${who} out bid ${lastBidder} who bid ${stdlib.formatCurrency(lastBid)}.`);
        } catch (e) {
            // Print a message that a bid failed because the auction ended
            console.log(`${who} failed to bid, because the auction is over`);
        }
        // Print the Bidder's balance after their bid
        console.log(`${who} balance after is ${await getBal()}`);
    };
    // Create three bidders, Alice, Bob, and Claire who will wait to race until runBidder is called.
    await runBidder('Alice');
    await runBidder('Bob');
    await runBidder('Claire');
    // A while loop that increments devnet transaction blocks forward until done is true.
    while ( ! done ) {
        await stdlib.wait(1);
    }
};
// The creator account creates the contract
const ctcCreator = accCreator.contract(backend);
await ctcCreator.participants.Creator({
    getSale: () => {
        console.log(`Creator sets parameters of sale:`, params);
        return params;
    },
    auctionReady: () => {
        startBidders();
    },
    seeBid: (who, amt) => {
        console.log(`Creator saw that ${stdlib.formatAddress(who)} bid ${stdlib.formatCurrency(amt)}.`);
    },
    showOutcome: (winner, amt) => {
        console.log(`Creator saw that ${stdlib.formatAddress(winner)} won with ${stdlib.formatCurrency(amt)}`);
    },
});

for ( const [who, acc] of bidders ) {
    // Store the balance of each bidder's account and how many NFTs the account holds
    const [ amt, amtNFT ] = await stdlib.balancesOf(acc, [null, nftId]);
    // Print the log of the user's balance and number of NFTs
    console.log(`${who} has ${stdlib.formatCurrency(amt)} ${stdlib.standardUnit} and ${amtNFT} of the NFT`);
}
done = true;