from database import db
from model.requests import Requests

UNASSIGNED_STAFF = 'helpdeskteam@lsu.edu'


def create_request(sender_email: str, request_type: str,
                   request_desc: str) -> dict:
    req = Requests(
        sender_email=sender_email,
        helpdesk_staff_email=UNASSIGNED_STAFF,
        request_type=request_type,
        request_desc=request_desc,
        request_status=0,
    )
    db.session.add(req)
    db.session.commit()
    return {'success': True, 'request_id': req.request_id}


def get_pending_requests() -> list:
    reqs = Requests.query.filter_by(request_status=0).all()
    return [_serialize(r) for r in reqs]


def get_requests_by_staff(helpdesk_staff_email: str) -> list:
    reqs = Requests.query.filter_by(
        helpdesk_staff_email=helpdesk_staff_email
    ).all()
    return [_serialize(r) for r in reqs]


def assign_request(request_id: int, helpdesk_staff_email: str) -> dict:
    req = db.session.get(Requests, request_id)
    if not req:
        return {'success': False, 'error': 'Request not found'}
    req.helpdesk_staff_email = helpdesk_staff_email
    db.session.commit()
    return {'success': True}


def complete_request(request_id: int) -> dict:
    req = db.session.get(Requests, request_id)
    if not req:
        return {'success': False, 'error': 'Request not found'}
    req.request_status = 1
    db.session.commit()
    return {'success': True}


def _serialize(r: Requests) -> dict:
    return {
        'request_id': r.request_id,
        'sender_email': r.sender_email,
        'helpdesk_staff_email': r.helpdesk_staff_email,
        'request_type': r.request_type,
        'request_desc': r.request_desc,
        'request_status': r.request_status,
    }
