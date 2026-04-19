from database import db
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, ForeignKeyConstraint, func


class Categories(db.Model):
    __tablename__ = "categories"
    category_name = db.Column(String(100), primary_key=True)
    parent_category = db.Column(String(100), ForeignKey("categories.category_name"), nullable=True)


class AuctionListings(db.Model):
    __tablename__ = "auction_listings"
    seller_email = db.Column(String(255), ForeignKey("sellers.email"), primary_key=True)
    listing_id = db.Column(Integer, primary_key=True)
    category = db.Column(String(100), ForeignKey("categories.category_name"), nullable=False)
    auction_title = db.Column(String(255), nullable=False)
    product_name = db.Column(String(255), nullable=False)
    product_description = db.Column(String(1000))
    quantity = db.Column(Integer, nullable=False)
    reserve_price = db.Column(Float, nullable=False)
    max_bids = db.Column(Integer, nullable=False)
    status = db.Column(Integer, nullable=False, default=1)  # 1: active, 0: inactive, 2: sold


class ListingRemovals(db.Model):
    __tablename__ = "listing_removals"
    removal_id = db.Column(Integer, primary_key=True, autoincrement=True)
    seller_email = db.Column(String(255), nullable=False)
    listing_id = db.Column(Integer, nullable=False)
    removal_reason = db.Column(String(500), nullable=False)
    bids_at_removal = db.Column(Integer, nullable=False)
    removed_at = db.Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        ForeignKeyConstraint(
            ['seller_email', 'listing_id'],
            ['auction_listings.seller_email', 'auction_listings.listing_id']
        ),
    )


class Bids(db.Model):
    __tablename__ = "bids"
    bid_id = db.Column(Integer, primary_key=True, autoincrement=True)
    seller_email = db.Column(String(255), nullable=False)
    listing_id = db.Column(Integer, nullable=False)
    bidder_email = db.Column(String(255), ForeignKey("bidders.email"), nullable=False)
    bid_price = db.Column(Float, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ['seller_email', 'listing_id'],
            ['auction_listings.seller_email', 'auction_listings.listing_id']
        ),
    )


class Transactions(db.Model):
    __tablename__ = "transactions"
    transaction_id = db.Column(Integer, primary_key=True, autoincrement=True)
    seller_email = db.Column(String(255), nullable=False)
    listing_id = db.Column(Integer, nullable=False)
    buyer_email = db.Column(String(255), ForeignKey("bidders.email"), nullable=False)
    date = db.Column(Date, nullable=False)
    payment = db.Column(Float, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ['seller_email', 'listing_id'],
            ['auction_listings.seller_email', 'auction_listings.listing_id']
        ),
    )


class Ratings(db.Model):
    __tablename__ = "ratings"
    bidder_email = db.Column(String(255), ForeignKey("bidders.email"), primary_key=True)
    seller_email = db.Column(String(255), ForeignKey("sellers.email"), primary_key=True)
    date = db.Column(Date, primary_key=True)
    rating = db.Column(Integer, nullable=False)
    rating_desc = db.Column(String(255))
    # Nullable so historical seed data loads without a transaction reference
    transaction_id = db.Column(Integer, ForeignKey("transactions.transaction_id"), nullable=True)
