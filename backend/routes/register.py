from flask import Blueprint, request, jsonify, session
from services.user_service import register_bidder, register_seller, register_helpdesk

register_bp = Blueprint('register', __name__)


@register_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    role = data.get('role', '').strip().lower()
    email = data.get('email', '').strip().lower()
    password_hash = data.get('password_hash', '')

    if role == 'bidder':
        age = data.get('age')
        try:
            age = int(age)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'error': 'Age must be a number'}), 400

        result = register_bidder(
            email=email,
            password_hash=password_hash,
            first_name=data.get('first_name', '').strip(),
            last_name=data.get('last_name', '').strip(),
            age=age,
            major=data.get('major', '').strip() or None,
        )

    elif role == 'seller':
        result = register_seller(
            email=email,
            password_hash=password_hash,
            bank_routing_number=data.get('bank_routing_number', '').strip(),
            bank_account_number=data.get('bank_account_number', '').strip(),
        )

    elif role == 'helpdesk':
        result = register_helpdesk(
            email=email,
            password_hash=password_hash,
            position=data.get('position', '').strip(),
        )

    else:
        return jsonify({'success': False, 'error': 'Invalid role'}), 400

    if result['success']:
        session['email'] = email
        session['role'] = role
        return jsonify({'success': True, 'role': role}), 201

    return jsonify(result), 409
