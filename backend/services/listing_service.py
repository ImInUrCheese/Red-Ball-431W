from database import db
from model.listings import Categories, AuctionListings, ListingRemovals, Bids, Transactions
from services.image_service import save_image, get_image_url
from sqlalchemy import or_

# Category hierarchy

def get_subcategories(parent_category: str) -> list:
    # 'Root' is an internal seeder node; treat 'All' and 'Root' as equivalent
    effective = 'Root' if parent_category == 'All' else parent_category
    cats = (Categories.query
            .filter_by(parent_category=effective)
            .order_by(Categories.category_name)
            .all())
    return [c.category_name for c in cats]


def get_leaf_categories() -> list:
    parent_names = (db.session.query(Categories.parent_category)
                   .filter(Categories.parent_category.isnot(None))
                   .distinct()
                   .subquery())
    leaves = (Categories.query
              .filter(~Categories.category_name.in_(parent_names))
              .order_by(Categories.category_name)
              .all())
    return [c.category_name for c in leaves]


def get_listings_by_category(category_name: str) -> list:
    from services.bid_service import get_listing_bids
    listings = (AuctionListings.query
                .filter_by(category=category_name, status=1)
                .all())
    result = []
    for l in listings:
        s = _serialize_listing(l)
        bid_info = get_listing_bids(l.seller_email, l.listing_id)
        if bid_info:
            s.update(bid_info)
        result.append(s)
    return result


# Listing detail

def get_listing_detail(seller_email: str, listing_id: int) -> dict | None:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return None
    bids = (Bids.query
            .filter_by(seller_email=seller_email, listing_id=listing_id)
            .order_by(Bids.bid_price.desc())
            .all())
    highest_bid = bids[0].bid_price if bids else None
    bid_count = len(bids)
    return {
        **_serialize_listing(listing),
        'highest_bid': highest_bid,
        'bid_count': bid_count,
        'bids_remaining': listing.max_bids - bid_count,
    }


# Seller listing management

def get_seller_listings(seller_email: str) -> dict:
    listings = AuctionListings.query.filter_by(seller_email=seller_email).all()
    grouped = {'active': [], 'inactive': [], 'sold': []}
    status_map = {1: 'active', 0: 'inactive', 2: 'sold'}
    for l in listings:
        key = status_map.get(l.status)
        if key:
            grouped[key].append(_serialize_listing(l))
    return grouped


def create_listing(seller_email: str, category: str, auction_title: str,
                   product_name: str, product_description: str,
                   quantity: int, reserve_price: float, max_bids: int) -> dict:
    last = (AuctionListings.query
            .filter_by(seller_email=seller_email)
            .order_by(AuctionListings.listing_id.desc())
            .first())
    next_id = (last.listing_id + 1) if last else 1

    listing = AuctionListings(
        seller_email=seller_email,
        listing_id=next_id,
        category=category,
        auction_title=auction_title,
        product_name=product_name,
        product_description=product_description,
        quantity=quantity,
        reserve_price=reserve_price,
        max_bids=max_bids,
        status=1,
    )
    db.session.add(listing)
    db.session.commit()
    return {'success': True, 'listing_id': next_id}


def update_listing(seller_email: str, listing_id: int, **fields) -> dict:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return {'success': False, 'error': 'Listing not found'}
    if listing.status == 2:
        return {'success': False, 'error': 'Sold listings cannot be edited'}
    if listing.status == 1:
        has_bids = Bids.query.filter_by(
            seller_email=seller_email, listing_id=listing_id
        ).first() is not None
        if has_bids:
            return {'success': False, 'error': 'Listing cannot be updated after bidding has started'}

    allowed = {'category', 'auction_title', 'product_name',
               'product_description', 'quantity', 'reserve_price', 'max_bids'}
    for key, value in fields.items():
        if key in allowed:
            setattr(listing, key, value)
    db.session.commit()
    return {'success': True}


def deactivate_listing(seller_email: str, listing_id: int,
                       removal_reason: str) -> dict:
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return {'success': False, 'error': 'Listing not found'}
    if listing.status != 1:
        return {'success': False, 'error': 'Only active listings can be deactivated'}

    bid_count = Bids.query.filter_by(
        seller_email=seller_email, listing_id=listing_id
    ).count()
    bids_remaining = listing.max_bids - bid_count

    db.session.add(ListingRemovals(
        seller_email=seller_email,
        listing_id=listing_id,
        removal_reason=removal_reason,
        bids_at_removal=bids_remaining,
    ))
    listing.status = 0
    db.session.commit()
    return {'success': True}

# Image upload

def upload_listing_image(seller_email: str, listing_id: int, file) -> dict:
    """Save an uploaded listing image and store its filename on the AuctionListings row.

    Accepts .jpg, .jpeg, .png. Falls back to DefaultUserImage.jpg when no
    image has been set.

    Returns:
        {'success': True, 'image_url': '/static/images/<filename>'}
        {'success': False, 'error': '<reason>'}
    """
    listing = db.session.get(AuctionListings, (seller_email, listing_id))
    if not listing:
        return {'success': False, 'error': 'Listing not found'}
    result = save_image(file)
    if not result['success']:
        return result
    listing.image_filename = result['filename']
    db.session.commit()
    return {'success': True, 'image_url': get_image_url(listing.image_filename)}


def get_seller_active_listings(seller_email: str) -> list:
    listings = (AuctionListings.query
                .filter_by(seller_email=seller_email, status=1)
                .all())
    result = []
    for l in listings:
        bids = (Bids.query
                .filter_by(seller_email=seller_email, listing_id=l.listing_id)
                .order_by(Bids.bid_price.desc())
                .all())
        bid_count = len(bids)
        highest_bid = bids[0].bid_price if bids else None
        result.append({
            **_serialize_listing(l),
            'highest_bid': highest_bid,
            'bid_count': bid_count,
            'bids_remaining': l.max_bids - bid_count,
        })
    return result


def get_seller_sales_history(seller_email: str) -> list:
    listings = (AuctionListings.query
                .filter_by(seller_email=seller_email)
                .filter(AuctionListings.status.in_([0, 2]))
                .all())
    result = []
    for l in listings:
        if l.status == 2:
            transaction = (Transactions.query
                           .filter_by(seller_email=seller_email, listing_id=l.listing_id)
                           .first())
            result.append({
                'listing_id': l.listing_id,
                'auction_title': l.auction_title,
                'category': l.category,
                'final_payment': transaction.payment if transaction else None,
                'date': transaction.date.isoformat() if transaction else None,
                'status': 'sold',
            })
        else:
            result.append({
                'listing_id': l.listing_id,
                'auction_title': l.auction_title,
                'category': l.category,
                'final_payment': None,
                'date': None,
                'status': 'unsold',
            })
    return result

# Search

def search_listings(keyword: str = None, min_price: float = None,
                    max_price: float = None) -> list:
    query = AuctionListings.query.filter_by(status=1)

    if keyword:
        pattern = f'%{keyword}%'
        query = query.filter(
            or_(
                AuctionListings.auction_title.ilike(pattern),
                AuctionListings.product_name.ilike(pattern),
                AuctionListings.product_description.ilike(pattern),
                AuctionListings.category.ilike(pattern),
                AuctionListings.seller_email.ilike(pattern),
            )
        )

    from services.bid_service import get_listing_bids
    result = []
    for l in query.all():
        s = _serialize_listing(l)
        bid_info = get_listing_bids(l.seller_email, l.listing_id)
        if bid_info:
            s.update(bid_info)

        effective_price = s.get('highest_bid') or 0
        if min_price is not None and effective_price < min_price:
            continue
        if max_price is not None and effective_price > max_price:
            continue

        result.append(s)
    return result

# Serializer

def _serialize_listing(l: AuctionListings) -> dict:
    return {
        'seller_email': l.seller_email,
        'listing_id': l.listing_id,
        'category': l.category,
        'auction_title': l.auction_title,
        'product_name': l.product_name,
        'product_description': l.product_description,
        'quantity': l.quantity,
        'reserve_price': l.reserve_price,
        'max_bids': l.max_bids,
        'status': l.status,
        'image_url': get_image_url(l.image_filename),
    }
