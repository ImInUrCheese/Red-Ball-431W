from flask import Blueprint, request, jsonify, session
from services.helpdesk_service import (
    create_request, get_pending_requests, get_requests_by_staff,
    assign_request, complete_request,
)
from services.listing_service import get_subcategories
from database import db
from model.listings import Categories

helpdesk_bp = Blueprint('helpdesk', __name__)

UNASSIGNED_STAFF = 'helpdeskteam@lsu.edu'


@helpdesk_bp.route('/helpdesk/tickets', methods=['POST'])
def submit_ticket():
    data = request.get_json()
    sender_email = data.get('sender_email', '').strip()
    request_type = data.get('request_type', '').strip()
    request_desc = data.get('request_desc', '').strip()
    if not sender_email or not request_type or not request_desc:
        return jsonify({'success': False, 'error': 'All fields are required'}), 400
    result = create_request(sender_email, request_type, request_desc)
    return jsonify(result), 201


@helpdesk_bp.route('/helpdesk/tickets', methods=['GET'])
def get_tickets():
    staff_email = request.args.get('staff_email', '').strip()
    if not staff_email:
        return jsonify({'error': 'staff_email required'}), 400

    mine = [t for t in get_requests_by_staff(staff_email)
            if t['helpdesk_staff_email'] == staff_email
            and staff_email != UNASSIGNED_STAFF]
    unclaimed = [t for t in get_pending_requests()
                 if t['helpdesk_staff_email'] == UNASSIGNED_STAFF]

    # Deduplicate: if a ticket is both mine and unclaimed (shouldn't happen), keep in mine
    mine_ids = {t['request_id'] for t in mine}
    unclaimed = [t for t in unclaimed if t['request_id'] not in mine_ids]

    return jsonify({'mine': mine, 'unclaimed': unclaimed}), 200


@helpdesk_bp.route('/helpdesk/tickets/<int:request_id>/claim', methods=['POST'])
def claim_ticket(request_id: int):
    data = request.get_json()
    staff_email = data.get('staff_email', '').strip()
    if not staff_email:
        return jsonify({'success': False, 'error': 'staff_email required'}), 400
    result = assign_request(request_id, staff_email)
    return jsonify(result), (200 if result['success'] else 404)


@helpdesk_bp.route('/helpdesk/tickets/<int:request_id>/complete', methods=['POST'])
def complete_ticket(request_id: int):
    result = complete_request(request_id)
    return jsonify(result), (200 if result['success'] else 404)


@helpdesk_bp.route('/helpdesk/categories', methods=['GET'])
def get_all_categories():
    cats = Categories.query.order_by(Categories.category_name).all()
    return jsonify([c.category_name for c in cats]), 200


@helpdesk_bp.route('/helpdesk/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    parent = data.get('parent_category', '').strip()
    child = data.get('category_name', '').strip()
    if not parent or not child:
        return jsonify({'success': False, 'error': 'parent_category and category_name are required'}), 400
    if db.session.get(Categories, child):
        return jsonify({'success': False, 'error': 'Category already exists'}), 409
    if not db.session.get(Categories, parent):
        return jsonify({'success': False, 'error': 'Parent category does not exist'}), 400
    db.session.add(Categories(category_name=child, parent_category=parent))
    db.session.commit()
    return jsonify({'success': True}), 201
