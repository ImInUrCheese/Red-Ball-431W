from flask import Blueprint, jsonify, request, session
from services.user_service import (
    get_bidder_profile, get_seller_profile, get_helpdesk_profile,
    get_payment_info, update_bidder_profile, update_seller_profile,
    update_password,
)

users_bp = Blueprint('users', __name__)


@users_bp.route('/profile', methods=['GET'])
def profile():
    email = session.get('email')
    role  = session.get('role')
    if not email or not role:
        return jsonify({'error': 'Not authenticated'}), 401

    if role == 'bidder':
        data = get_bidder_profile(email)
    elif role == 'seller':
        data = get_seller_profile(email)
    elif role == 'helpdesk':
        data = get_helpdesk_profile(email)
    else:
        return jsonify({'error': 'Unknown role'}), 400

    if data is None:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(data), 200


@users_bp.route('/profile', methods=['PATCH'])
def update_profile():
    email = session.get('email')
    role  = session.get('role')
    if not email or not role:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()

    if role == 'bidder':
        age = data.get('age')
        if age is not None:
            try:
                age = int(age)
            except (TypeError, ValueError):
                return jsonify({'success': False, 'error': 'Age must be a number'}), 400
        result = update_bidder_profile(
            email=email,
            first_name=data.get('first_name') or None,
            last_name=data.get('last_name') or None,
            age=age,
            major=data.get('major') or None,
        )
    elif role == 'seller':
        result = update_seller_profile(
            email=email,
            bank_routing_number=data.get('bank_routing_number') or None,
            bank_account_number=data.get('bank_account_number') or None,
        )
    else:
        return jsonify({'success': False, 'error': 'Profile updates not supported for this role'}), 400

    return jsonify(result), (200 if result.get('success') else 400)


@users_bp.route('/change-password', methods=['POST'])
def change_password():
    email = session.get('email')
    if not email:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json()
    new_password_hash = data.get('new_password_hash', '').strip()
    if not new_password_hash:
        return jsonify({'success': False, 'error': 'new_password_hash is required'}), 400

    result = update_password(email, new_password_hash)
    return jsonify(result), (200 if result.get('success') else 400)


@users_bp.route('/payment', methods=['GET'])
def payment():
    email = session.get('email')
    if not email:
        return jsonify({'error': 'Not authenticated'}), 401
    data = get_payment_info(email)
    if data is None:
        return jsonify({'error': 'No payment info found'}), 404
    return jsonify(data), 200
