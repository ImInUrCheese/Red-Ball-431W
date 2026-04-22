from database import db
from model.listings import AuctionListings, Bids
from services.notification_service import create_notification


def place_bid(bidder_email: str, seller_email: str,
              listing_id: int, bid_price: float) -> dict:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return {'success': False, 'error': 'Listing not found'}
    if listing.status != 1:
        return {'success': False, 'error': 'Auction has ended'}

    bids = (Bids.query
            .filter_by(seller_email=seller_email, listing_id=listing_id)
            .order_by(Bids.bid_price.desc())
            .all())
    bid_count = len(bids)

    # Auction end rule
    if bid_count >= listing.max_bids:
        return {'success': False, 'error': 'Auction has ended'}

    # Increment rule
    highest = bids[0].bid_price if bids else 0
    if bid_price < highest + 1:
        return {
            'success': False,
            'error': f'Bid must be at least ${highest + 1:.2f}'
        }

    # Turn-taking rule
    if bids and bids[0].bidder_email == bidder_email:
        return {
            'success': False,
            'error': 'You must wait for another bidder before bidding again'
        }

    new_bid = Bids(
        seller_email=seller_email,
        listing_id=listing_id,
        bidder_email=bidder_email,
        bid_price=bid_price,
    )
    db.session.add(new_bid)
    db.session.commit()

    new_bid_count = bid_count + 1
    bids_remaining = listing.max_bids - new_bid_count

    # Check if auction is now complete
    if new_bid_count >= listing.max_bids:
        _close_auction(listing, bids + [new_bid])

    return {
        'success': True,
        'highest_bid': bid_price,
        'bids_remaining': bids_remaining,
        'auction_complete': new_bid_count >= listing.max_bids,
    }

def get_bids_by_bidder(bidder_email: str) -> list:
    bids = (Bids.query
            .filter_by(bidder_email=bidder_email)
            .all())

    # Group by (seller_email, listing_id) — keep only each bidder's highest bid per listing
    seen = {}
    for bid in sorted(bids, key=lambda b: b.bid_price, reverse=True):
        key = (bid.seller_email, bid.listing_id)
        if key not in seen:
            seen[key] = bid

    result = []
    for (seller_email, listing_id), bid in seen.items():
        listing = db.session.get(AuctionListings, (seller_email, listing_id))
        if not listing or listing.status != 1:
            continue  # skip inactive/sold auctions

        all_bids = (Bids.query
                    .filter_by(seller_email=seller_email, listing_id=listing_id)
                    .order_by(Bids.bid_price.desc())
                    .all())

        highest_bid = all_bids[0].bid_price if all_bids else 0
        bid_count = len(all_bids)
        bids_remaining = listing.max_bids - bid_count
        leading = all_bids[0].bidder_email == bidder_email if all_bids else False

        result.append({
            'seller_email': seller_email,
            'listing_id': listing_id,
            'auction_title': listing.auction_title,
            'your_bid': bid.bid_price,
            'highest_bid': highest_bid,
            'bids_remaining': bids_remaining,
            'leading': leading,
        })

    return result


def get_bid_history(seller_email: str, listing_id: int) -> list | None:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return None
    bids = (Bids.query
            .filter_by(seller_email=seller_email, listing_id=listing_id)
            .order_by(Bids.bid_price.desc())
            .all())
    return [{'bidder_email': b.bidder_email, 'bid_price': b.bid_price} for b in bids]


def get_listing_bids(seller_email: str, listing_id: int) -> dict:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return None
    bids = (Bids.query
            .filter_by(seller_email=seller_email, listing_id=listing_id)
            .order_by(Bids.bid_price.desc())
            .all())
    bid_count = len(bids)
    return {
        'bid_count': bid_count,
        'bids_remaining': listing.max_bids - bid_count,
        'highest_bid': bids[0].bid_price if bids else None,
        'highest_bidder': bids[0].bidder_email if bids else None,
    }


def check_auction_complete(seller_email: str, listing_id: int) -> dict:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return None
    bids = (Bids.query
            .filter_by(seller_email=seller_email, listing_id=listing_id)
            .order_by(Bids.bid_price.desc())
            .all())
    complete = len(bids) >= listing.max_bids
    if not complete:
        return {'complete': False}
    winner = bids[0].bidder_email if bids else None
    reserve_met = bids[0].bid_price >= listing.reserve_price if bids else False
    return {
        'complete': True,
        'winner': winner if reserve_met else None,
        'reserve_met': reserve_met,
        'highest_bid': bids[0].bid_price if bids else None,
    }

# Internal called when max_bids is reached after a bid is placed

def _close_auction(listing: AuctionListings, all_bids: list):
    all_bids_sorted = sorted(all_bids, key=lambda b: b.bid_price, reverse=True)
    winner = all_bids_sorted[0]
    reserve_met = winner.bid_price >= listing.reserve_price

    # Collect all unique bidders
    bidder_emails = set(b.bidder_email for b in all_bids_sorted)

    if reserve_met:
        listing.status = 0  # Remove from browsing until payment marks it sold (status=2)
        db.session.commit()
        create_notification(
            user_email=winner.bidder_email,
            notification_type='auction_won',
            message=(f'You won the auction for "{listing.auction_title}" '
                     f'with a bid of ${winner.bid_price:.2f}. Please complete payment.'),
            seller_email=listing.seller_email,
            listing_id=listing.listing_id,
        )
        create_notification(
            user_email=winner.bidder_email,
            notification_type='payment_due',
            message=(f'Payment of ${winner.bid_price:.2f} is due for '
                     f'"{listing.auction_title}".'),
            seller_email=listing.seller_email,
            listing_id=listing.listing_id,
        )
        for email in bidder_emails - {winner.bidder_email}:
            create_notification(
                user_email=email,
                notification_type='auction_lost',
                message=(f'The auction for "{listing.auction_title}" has ended. '
                         f'The winning bid was ${winner.bid_price:.2f}.'),
                seller_email=listing.seller_email,
                listing_id=listing.listing_id,
            )
    else:
        listing.status = 0
        db.session.commit()
        for email in bidder_emails:
            create_notification(
                user_email=email,
                notification_type='auction_ended_no_sale',
                message=(f'The auction for "{listing.auction_title}" ended without a sale. '
                         f'The reserve price was not met.'),
                seller_email=listing.seller_email,
                listing_id=listing.listing_id,
            )
