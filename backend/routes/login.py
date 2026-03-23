from flask import Blueprint, request, jsonify
from services.user_service import authenticate

login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    result = authenticate(
        email=data.get('email', '').strip().lower(),
        password_hash=data.get('password_hash', '')
    )
    return jsonify(result), (200 if result['success'] else 401)