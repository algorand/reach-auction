'reach 0.1';

// Creator is a Participant that has getSale, auctionReady, seeBid and 
// showOutcome functions.  A participant is an “actor” who 
// takes part in the application (dApp). 
// Participants are associated with an account (address) 
// on the consensus network.
export const main = Reach.App(() => {
    const Creator = Participant('Creator', {
        getSale: Fun([], Object({
            nftId: Token,
            minBid: UInt,
            lenInBlocks: UInt,
        })),
        auctionReady: Fun([], Null),
        seeBid: Fun([Address, UInt], Null),
        showOutcome: Fun([Address, UInt], Null),
    });
     // Bidder is an API that has a bid function.
    const Bidder = API('Bidder', {
        bid: Fun([UInt], Tuple(Address, UInt)),
    });
    init();

    Creator.only(() => {
         // Binding the value of getSale to the result of interacting
         // with the participant. This happens in a local step. 
         // declassify declassifies the argument, 
         // in this case that means the value of getSale
        const {nftId, minBid, lenInBlocks} = declassify(interact.getSale());
    });
    Creator.publish(nftId, minBid, lenInBlocks);
    const amt = 1;
    commit();
    Creator.pay([[amt, nftId]]);
    Creator.interact.auctionReady();
    assert(balance(nftId) == amt, "balance of NFT is wrong");
    const end = lastConsensusTime() + lenInBlocks;
    // Create the parallelReduce; align the Creator as the first highestBidder, 
    // the minBid as the lastPrice, and set isFirstBid to the boolean, "true"
    const [
        highestBidder,
        lastPrice,
        isFirstBid,
    ] = parallelReduce([Creator, minBid, true])
    // The first invariant, asserts that the balance 
    // of the nftID will be equal to the amount of the NFTs
        .invariant(balance(nftId) == amt)
    // The second invariant which states that the balance 
    // will either be 0 if it is the first bid or equal to 
    // the most recent price    
        .invariant(balance() == (isFirstBid ? 0 : lastPrice))
        .while(lastConsensusTime() <= end)
        // If the bid is greater than the currentPrice, 
        // the transfer is made to the highest bidder. 
        // It will also refund the previous high bidder. 

        .api_(Bidder.bid, (bid) => {
            check(bid > lastPrice, "bid is too low");
            // Return the bid and a created "notify" argument to update 
            // other APIs with the newest high bidder and their price.
            return [ bid, (notify) => {
                notify([highestBidder, lastPrice]);
                // If this bid is not the first bid then the api_ 
                // will return the lastPrice to the address of the 
                // previous highest bidder.
                if ( ! isFirstBid ) {
                    transfer(lastPrice).to(highestBidder);
                }
                const who = this;
                // Creator interacts with the seeBid function, 
                // which accepts who (an API Bidder) and their bid.
                Creator.interact.seeBid(who, bid);
                // Return highestBidder, lastPrice, and isFirstBid. 
                // The parallelReduce will now update the variables in the race. 
                // As a result, new Bidders will see the updated highestBidder and the lastPrice.
                return [who, bid, false];
            }];
        })
        // A timeout method is provided to escape the parallelReduce. 
        // This timeout is triggered when the end of absoluteTime resolves to true. 
        // Once timeout is triggered, Creator will move the DApp to a consensus step with publish 
        // and the DApp will return the values of highestBidder, lastPrice, and isFirstBid
        .timeout(absoluteTime(end), () => {
            Creator.publish();
            return [highestBidder, lastPrice, isFirstBid];
        });

        transfer(amt, nftId).to(highestBidder);
        if ( ! isFirstBid ) { transfer(lastPrice).to(Creator); }
        Creator.interact.showOutcome(highestBidder, lastPrice);
    commit();
    exit();
});