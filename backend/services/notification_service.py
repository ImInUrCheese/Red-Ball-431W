from database import db
from model.notifications import Notifications


def create_notification(user_email: str, notification_type: str, message: str,
                        seller_email: str = None, listing_id: int = None):
    notification = Notifications(
        user_email=user_email,
        notification_type=notification_type,
        message=message,
        seller_email=seller_email,
        listing_id=listing_id,
    )
    db.session.add(notification)
    db.session.commit()


def get_user_notifications(user_email: str) -> list:
    notifications = (Notifications.query
                     .filter_by(user_email=user_email)
                     .order_by(Notifications.created_at.desc())
                     .all())
    return [_serialize(n) for n in notifications]


def mark_read(notification_id: int) -> bool:
    notification = db.session.get(Notifications, notification_id)
    if not notification:
        return False
    notification.is_read = 1
    db.session.commit()
    return True


def mark_all_read(user_email: str):
    (Notifications.query
     .filter_by(user_email=user_email, is_read=0)
     .update({'is_read': 1}))
    db.session.commit()


def _serialize(n: Notifications) -> dict:
    return {
        'notification_id': n.notification_id,
        'notification_type': n.notification_type,
        'message': n.message,
        'seller_email': n.seller_email,
        'listing_id': n.listing_id,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat() if n.created_at else None,
    }
