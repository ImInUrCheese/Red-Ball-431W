from database import db
from sqlalchemy import String, Integer, DateTime, ForeignKey, func


class Notifications(db.Model):
    __tablename__ = "notifications"
    notification_id = db.Column(Integer, primary_key=True, autoincrement=True)
    user_email = db.Column(String(255), ForeignKey("users.email"), nullable=False)
    notification_type = db.Column(String(50), nullable=False)
    # Valid types: 'auction_won', 'auction_lost', 'auction_ended_no_sale',
    #              'payment_due', 'bid_placed', 'bid_rejected', 'listing_removed'
    message = db.Column(String(500), nullable=False)
    # Listing reference stored loosely — no FK constraint since the same
    # listing_id can be reused and notifications must outlive listing changes
    seller_email = db.Column(String(255), nullable=True)
    listing_id = db.Column(Integer, nullable=True)
    is_read = db.Column(Integer, nullable=False, default=0)  # 0: unread, 1: read
    created_at = db.Column(DateTime, nullable=False, server_default=func.now())
