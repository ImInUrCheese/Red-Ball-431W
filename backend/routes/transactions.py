from flask import Blueprint, jsonify, request, session
from services.transaction_service import record_transaction, get_listing_transaction
from services.bid_service import check_auction_complete

transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('/transactions', methods=['POST'])
def post_transaction():
    email = session.get('email')
    if not email:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()
    seller_email = data.get('seller_email', '').strip().lower()
    listing_id   = int(data.get('listing_id'))
    payment      = float(data.get('payment'))

    status = check_auction_complete(seller_email, listing_id)
    if not status or not status.get('complete'):
        return jsonify({'success': False, 'error': 'Auction has not ended'}), 400
    if status.get('winner') != email:
        return jsonify({'success': False, 'error': 'You are not the winner of this auction'}), 403

    result = record_transaction(seller_email, listing_id, email, payment)
    return jsonify(result), (200 if result.get('success') else 400)


@transactions_bp.route('/transactions/listing/<seller_email>/<int:listing_id>', methods=['GET'])
def listing_transaction(seller_email, listing_id):
    result = get_listing_transaction(seller_email, listing_id)
    if result is None:
        return jsonify({'error': 'No transaction found'}), 404
    return jsonify(result), 200
