from flask import Blueprint, request, jsonify
from services.listing_service import (
    get_subcategories, get_leaf_categories, get_listings_by_category, get_listing_detail,
    get_seller_listings, create_listing, update_listing,
    deactivate_listing, upload_listing_image, search_listings,
    get_seller_active_listings, get_seller_sales_history
)

listings_bp = Blueprint('listings', __name__)

@listings_bp.route('/categories/<parent_category>', methods=['GET'])
def categories(parent_category):
    return jsonify(get_subcategories(parent_category)), 200

@listings_bp.route('/categories/leaf', methods=['GET'])
def leaf_categories():
    return jsonify(get_leaf_categories()), 200

@listings_bp.route('/listings/category/<category_name>', methods=['GET'])
def listings_by_category(category_name):
    return jsonify(get_listings_by_category(category_name)), 200

@listings_bp.route('/listings/search', methods=['GET'])
def search():
    keyword  = request.args.get('keyword')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    return jsonify(search_listings(keyword, min_price, max_price)), 200

@listings_bp.route('/seller/<email>/active-listings', methods=['GET'])
def seller_active_listings(email):
    return jsonify(get_seller_active_listings(email)), 200

@listings_bp.route('/seller/<email>/sales-history', methods=['GET'])
def seller_sales_history(email):
    return jsonify(get_seller_sales_history(email)), 200

@listings_bp.route('/listings/seller/<seller_email>', methods=['GET'])
def seller_listings(seller_email):
    return jsonify(get_seller_listings(seller_email)), 200

@listings_bp.route('/listings/<seller_email>/<int:listing_id>', methods=['GET'])
def listing_detail(seller_email, listing_id):
    result = get_listing_detail(seller_email, listing_id)
    if result is None:
        return jsonify({'error': 'Listing not found'}), 404
    return jsonify(result), 200

@listings_bp.route('/listings', methods=['POST'])
def post_listing():
    data = request.get_json()
    result = create_listing(
        seller_email=data.get('seller_email', '').strip().lower(),
        category=data.get('category'),
        auction_title=data.get('auction_title'),
        product_name=data.get('product_name'),
        product_description=data.get('product_description'),
        quantity=int(data.get('quantity')),
        reserve_price=float(data.get('reserve_price')),
        max_bids=int(data.get('max_bids')),
    )
    return jsonify(result), 201

@listings_bp.route('/listings/<seller_email>/<int:listing_id>', methods=['PATCH'])
def patch_listing(seller_email, listing_id):
    data = request.get_json()
    result = update_listing(seller_email, listing_id, **data)
    return jsonify(result), (200 if result['success'] else 400)

@listings_bp.route('/listings/<seller_email>/<int:listing_id>/deactivate', methods=['POST'])
def deactivate(seller_email, listing_id):
    data = request.get_json()
    result = deactivate_listing(seller_email, listing_id, data.get('removal_reason', ''))
    return jsonify(result), (200 if result['success'] else 400)

@listings_bp.route('/listings/<seller_email>/<int:listing_id>/image', methods=['POST'])
def listing_image(seller_email, listing_id):
    file = request.files.get('file')
    if not file:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    result = upload_listing_image(seller_email, listing_id, file)
    return jsonify(result), (200 if result['success'] else 400)