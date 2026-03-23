import csv
from sqlalchemy import String, Integer, ForeignKey, Float
import hashlib
from database import db

def parse(file_path, type_map={}):
    if type_map is None:
        type_map = {}
    columns = {}
    with open(file_path, mode="r", newline="", encoding="utf-8-sig") as file:
        data = csv.DictReader(file)
        for field in data.fieldnames:
            columns[field] = []
        for row in data:
            for field in data.fieldnames:
                raw = row[field].strip()
                if raw == "":
                    value = None
                else:
                    converter = type_map.get(field, str)
                    if converter == int:
                        value = int(raw)
                    elif converter == float:
                        value = float(raw)
                    else:
                        value = raw
                columns[field].append(value)
    return columns

def seed(table, data, size):
    for i in range(size):
        row = {}
        for col in data:
            value = data[col][i]
            if isinstance(value, str):
                value = value.strip()
            row[col] = value
        new_entry = table(**row)
        db.session.add(new_entry)
    db.session.commit()

class Users(db.Model):
    __tablename__ = "users"
    email = db.Column(String(255), primary_key=True)
    password = db.Column(String(255), nullable=False)

class Bidders(db.Model):
    __tablename__ = "bidders"
    email = db.Column(String(255), ForeignKey("users.email"), primary_key=True)
    first_name = db.Column(String(100), nullable=False)
    last_name = db.Column(String(100), nullable=False)
    age = db.Column(Integer, nullable=False)
    home_address_id = db.Column(String(32))
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
    Position = db.Column(String(100), nullable=False)

def init_db():
    db.create_all()
    
    db.session.execute(db.text("SET FOREIGN_KEY_CHECKS=0"))
    
    if Users.query.first() is None:
        users_data = parse("testdb/Users.csv")
        users_size = len(users_data['email'])
        for i in range(users_size):
            users_data['password'][i] = hashlib.sha256(users_data['password'][i].encode()).hexdigest()
        seed(Users, users_data, users_size)

    if Bidders.query.first() is None:
        bidders_data = parse("testdb/Bidders.csv", type_map={"age": int})
        bidders_size = len(bidders_data['email'])
        seed(Bidders, bidders_data, bidders_size)

    if Sellers.query.first() is None:
        sellers_data = parse("testdb/Sellers.csv")
        sellers_size = len(sellers_data['email'])
        seed(Sellers, sellers_data, sellers_size)

    if Helpdesk.query.first() is None:
        helpdesk_data = parse("testdb/Helpdesk.csv")
        helpdesk_size = len(helpdesk_data['email'])
        seed(Helpdesk, helpdesk_data, helpdesk_size)

    db.session.execute(db.text("SET FOREIGN_KEY_CHECKS=1"))
    db.session.commit()