from flask import Blueprint, jsonify
from services.rating_service import get_seller_average_rating, get_seller_ratings, can_rate, submit_rating
from flask import request

ratings_bp = Blueprint('ratings', __name__)

@ratings_bp.route('/ratings/seller/<seller_email>/average', methods=['GET'])
def seller_average_rating(seller_email):
    result = get_seller_average_rating(seller_email)
    return jsonify({'average_rating': result}), 200

@ratings_bp.route('/ratings/seller/<seller_email>', methods=['GET'])
def seller_ratings(seller_email):
    return jsonify(get_seller_ratings(seller_email)), 200

@ratings_bp.route('/ratings/check', methods=['GET'])
def check_rating():
    bidder_email   = request.args.get('bidder_email')
    seller_email   = request.args.get('seller_email')
    transaction_id = request.args.get('transaction_id', type=int)
    return jsonify(can_rate(bidder_email, seller_email, transaction_id)), 200

@ratings_bp.route('/ratings', methods=['POST'])
def post_rating():
    data = request.get_json()
    result = submit_rating(
        bidder_email=data.get('bidder_email'),
        seller_email=data.get('seller_email'),
        transaction_id=int(data.get('transaction_id')),
        rating=int(data.get('rating')),
        rating_desc=data.get('rating_desc'),
    )
    return jsonify(result), (201 if result['success'] else 400)