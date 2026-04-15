from datetime import date
from database import db
from model.listings import AuctionListings, Transactions
from services.notification_service import create_notification


def record_transaction(seller_email: str, listing_id: int,
                       buyer_email: str, payment: float) -> dict:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return {'success': False, 'error': 'Listing not found'}
    if listing.status == 2:
        return {'success': False, 'error': 'Transaction already recorded for this listing'}
    if listing.status == 1:
        return {'success': False, 'error': 'Auction has not ended yet'}

    transaction = Transactions(
        seller_email=seller_email,
        listing_id=listing_id,
        buyer_email=buyer_email,
        date=date.today(),
        payment=payment,
    )
    db.session.add(transaction)
    listing.status = 2
    db.session.commit()

    create_notification(
        user_email=buyer_email,
        notification_type='payment_due',
        message=(f'Your payment of ${payment:.2f} for "{listing.auction_title}" '
                 f'has been recorded. Thank you!'),
        seller_email=seller_email,
        listing_id=listing_id,
    )

    return {'success': True, 'transaction_id': transaction.transaction_id}


def get_buyer_transactions(buyer_email: str) -> list:
    transactions = (Transactions.query
                    .filter_by(buyer_email=buyer_email)
                    .order_by(Transactions.date.desc())
                    .all())
    return [_serialize(t) for t in transactions]


def get_seller_transactions(seller_email: str) -> list:
    transactions = (Transactions.query
                    .filter_by(seller_email=seller_email)
                    .order_by(Transactions.date.desc())
                    .all())
    return [_serialize(t) for t in transactions]


def _serialize(t: Transactions) -> dict:
    return {
        'transaction_id': t.transaction_id,
        'seller_email': t.seller_email,
        'listing_id': t.listing_id,
        'buyer_email': t.buyer_email,
        'date': t.date.isoformat(),
        'payment': t.payment,
    }
