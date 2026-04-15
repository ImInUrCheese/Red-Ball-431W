from database import db
from model.listings import Ratings, Transactions
from sqlalchemy import func


def can_rate(bidder_email: str, seller_email: str,
             transaction_id: int) -> dict:
    # Must have a completed transaction with this seller
    transaction = db.session.get(Transactions, transaction_id)
    if not transaction:
        return {'eligible': False, 'reason': 'Transaction not found'}
    if transaction.buyer_email != bidder_email:
        return {'eligible': False, 'reason': 'Transaction does not belong to this bidder'}
    if transaction.seller_email != seller_email:
        return {'eligible': False, 'reason': 'Transaction does not belong to this seller'}

    # No duplicate rating for the same transaction
    existing = Ratings.query.filter_by(transaction_id=transaction_id).first()
    if existing:
        return {'eligible': False, 'reason': 'You have already rated this transaction'}

    return {'eligible': True}


def submit_rating(bidder_email: str, seller_email: str, transaction_id: int,
                  rating: int, rating_desc: str = None) -> dict:
    eligibility = can_rate(bidder_email, seller_email, transaction_id)
    if not eligibility['eligible']:
        return {'success': False, 'error': eligibility['reason']}

    transaction = db.session.get(Transactions, transaction_id)
    db.session.add(Ratings(
        bidder_email=bidder_email,
        seller_email=seller_email,
        date=transaction.date,
        rating=rating,
        rating_desc=rating_desc,
        transaction_id=transaction_id,
    ))
    db.session.commit()
    return {'success': True}


def get_seller_average_rating(seller_email: str) -> float | None:
    result = (db.session.query(func.avg(Ratings.rating))
              .filter_by(seller_email=seller_email)
              .scalar())
    return round(float(result), 2) if result is not None else None


def get_seller_ratings(seller_email: str) -> list:
    ratings = Ratings.query.filter_by(seller_email=seller_email).all()
    return [_serialize(r) for r in ratings]


def _serialize(r: Ratings) -> dict:
    return {
        'bidder_email': r.bidder_email,
        'seller_email': r.seller_email,
        'date': r.date.isoformat(),
        'rating': r.rating,
        'rating_desc': r.rating_desc,
        'transaction_id': r.transaction_id,
    }
