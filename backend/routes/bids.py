from flask import Blueprint, request, jsonify
from services.bid_service import place_bid, get_listing_bids, check_auction_complete, get_bids_by_bidder

bids_bp = Blueprint('bids', __name__)

@bids_bp.route('/bids', methods=['POST'])
def post_bid():
    data = request.get_json()
    result = place_bid(
        bidder_email=data.get('bidder_email', '').strip().lower(),
        seller_email=data.get('seller_email', '').strip().lower(),
        listing_id=int(data.get('listing_id')),
        bid_price=float(data.get('bid_price')),
    )
    return jsonify(result), (200 if result['success'] else 400)

@bids_bp.route('/bids/<seller_email>/<int:listing_id>', methods=['GET'])
def get_bids(seller_email, listing_id):
    result = get_listing_bids(seller_email, listing_id)
    if result is None:
        return jsonify({'error': 'Listing not found'}), 404
    return jsonify(result), 200

@bids_bp.route('/bids/<seller_email>/<int:listing_id>/status', methods=['GET'])
def get_bid_status(seller_email, listing_id):
    result = check_auction_complete(seller_email, listing_id)
    if result is None:
        return jsonify({'error': 'Listing not found'}), 404
    return jsonify(result), 200

@bids_bp.route('/bids/bidder/<email>', methods=['GET'])
def get_bidder_bids(email):
    result = get_bids_by_bidder(email)
    return jsonify(result), 200