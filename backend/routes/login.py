from flask import Blueprint, request, jsonify, session
from services.user_service import authenticate, get_roles

login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    result = authenticate(email=email, password_hash=data.get('password_hash', ''))
    if result['success']:
        session['email'] = email
        roles = result['roles']
        if len(roles) == 1:
            session['role'] = roles[0]
    return jsonify(result), (200 if result['success'] else 401)


@login_bp.route('/select-role', methods=['POST'])
def select_role():
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    data = request.get_json()
    role = data.get('role', '').strip().lower()
    valid_roles = get_roles(session['email'])
    if role not in valid_roles:
        return jsonify({'success': False, 'error': 'Invalid role for this account'}), 400
    session['role'] = role
    return jsonify({'success': True, 'role': role}), 200


@login_bp.route('/me', methods=['GET'])
def me():
    if 'email' in session and 'role' in session:
        return jsonify({'success': True, 'email': session['email'], 'role': session['role']}), 200
    return jsonify({'success': False}), 401


@login_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True}), 200