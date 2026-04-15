from database import db
from sqlalchemy import String, Integer, ForeignKey


class Requests(db.Model):
    __tablename__ = "requests"
    request_id = db.Column(Integer, primary_key=True, autoincrement=True)
    sender_email = db.Column(String(255), ForeignKey("users.email"), nullable=False)
    # No FK on helpdesk_staff_email — helpdeskteam@lsu.edu is a pseudo-account
    helpdesk_staff_email = db.Column(String(255), nullable=False)
    request_type = db.Column(String(50), nullable=False)
    request_desc = db.Column(String(255), nullable=False)
    request_status = db.Column(Integer, nullable=False, default=0)  # 0: incomplete, 1: complete
