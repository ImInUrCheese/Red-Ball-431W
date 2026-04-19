from database import db
from sqlalchemy import String, Integer, ForeignKey


class ZipcodeInfo(db.Model):
    __tablename__ = "zipcode_info"
    zipcode = db.Column(String(10), primary_key=True)
    city = db.Column(String(100), nullable=False)
    state = db.Column(String(50), nullable=False)


class Address(db.Model):
    __tablename__ = "address"
    address_id = db.Column(String(32), primary_key=True)
    zipcode = db.Column(String(10), ForeignKey("zipcode_info.zipcode"), nullable=False)
    street_num = db.Column(Integer, nullable=False)
    street_name = db.Column(String(255), nullable=False)


class CreditCards(db.Model):
    __tablename__ = "credit_cards"
    credit_card_num = db.Column(String(20), primary_key=True)
    card_type = db.Column(String(50), nullable=False)
    expire_month = db.Column(Integer, nullable=False)
    expire_year = db.Column(Integer, nullable=False)
    security_code = db.Column(String(4), nullable=False)
    owner_email = db.Column(String(255), ForeignKey("bidders.email"), nullable=False)
