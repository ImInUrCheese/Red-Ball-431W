from database import db
from sqlalchemy import String, Integer, Float, ForeignKey


class Users(db.Model):
    __tablename__ = "users"
    email = db.Column(String(255), primary_key=True)
    password = db.Column(String(255), nullable=False)
    image_filename = db.Column(String(255), nullable=True)


class Bidders(db.Model):
    __tablename__ = "bidders"
    email = db.Column(String(255), ForeignKey("users.email"), primary_key=True)
    first_name = db.Column(String(100), nullable=False)
    last_name = db.Column(String(100), nullable=False)
    age = db.Column(Integer, nullable=False)
    home_address_id = db.Column(String(32), ForeignKey("address.address_id"))
    major = db.Column(String(100))


class Sellers(db.Model):
    __tablename__ = "sellers"
    email = db.Column(String(255), ForeignKey("users.email"), primary_key=True)
    bank_routing_number = db.Column(String(50), nullable=False)
    bank_account_number = db.Column(String(50), nullable=False)
    balance = db.Column(Float, nullable=False)


class Helpdesk(db.Model):
    __tablename__ = "helpdesk"
    email = db.Column(String(255), ForeignKey("users.email"), primary_key=True)
    position = db.Column(String(100), nullable=False)


class LocalVendors(db.Model):
    __tablename__ = "local_vendors"
    email = db.Column(String(255), ForeignKey("sellers.email"), primary_key=True)
    business_name = db.Column(String(255), nullable=False)
    business_address_id = db.Column(String(32), ForeignKey("address.address_id"), nullable=False)
    customer_service_phone_number = db.Column(String(20), nullable=False)
