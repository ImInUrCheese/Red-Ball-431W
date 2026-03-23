from flask import current_app
from sqlalchemy import text
from model.users import User


def authenticate(email: str, password_hash: str) -> dict:
    session = current_app.session_factory()
    try:
        user = session.get(User, email)
        if user and user.password == password_hash:
            role = _get_role(session, email)
            return {'success': True, 'role': role}
        return {'success': False, 'error': 'Invalid email or password'}
    finally:
        session.close()


def _get_role(session, email: str) -> str:
    row = session.execute(
        text("SELECT email FROM bidders WHERE email = :e"), {'e': email}
    ).fetchone()
    if row:
        return 'bidder'

    row = session.execute(
        text("SELECT email FROM sellers WHERE email = :e"), {'e': email}
    ).fetchone()
    if row:
        return 'seller'

    row = session.execute(
        text("SELECT email FROM helpdesk WHERE email = :e"), {'e': email}
    ).fetchone()
    if row:
        return 'helpdesk'

    return 'unknown'
