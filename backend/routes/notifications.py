from flask import Blueprint, jsonify
from services.notification_service import get_user_notifications, mark_read, mark_all_read

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications/<user_email>', methods=['GET'])
def get_notifications(user_email):
    return jsonify(get_user_notifications(user_email)), 200

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PATCH'])
def read_one(notification_id):
    success = mark_read(notification_id)
    return jsonify({'success': success}), (200 if success else 404)

@notifications_bp.route('/notifications/<user_email>/read-all', methods=['PATCH'])
def read_all(user_email):
    mark_all_read(user_email)
    return jsonify({'success': True}), 200