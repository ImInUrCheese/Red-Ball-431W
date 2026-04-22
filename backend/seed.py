import csv
import hashlib
from datetime import datetime
from database import db
from model.users import Users, Bidders, Sellers, Helpdesk, LocalVendors
from model.requests import Requests
from model.address import ZipcodeInfo, Address, CreditCards
from model.listings import Categories, AuctionListings, ListingRemovals, Bids, Transactions, Ratings
from model.notifications import Notifications


def parse(file_path, type_map={}):
    """Read a CSV into a dict of column_name -> list of values.
    type_map keys are CSV header names; supported converters: int, float, 'price', 'date'.
    """
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
                        value = int(raw.replace(',', ''))
                    elif converter == float:
                        value = float(raw.replace(',', ''))
                    elif converter == 'price':
                        value = float(raw.replace('$', '').replace(',', '').strip())
                    elif converter == 'date':
                        value = datetime.strptime(raw, '%m/%d/%y').date()
                    else:
                        value = raw
                columns[field].append(value)
    return columns


def seed(table, data, size):
    for i in range(size):
        row = {col: (data[col][i].strip() if isinstance(data[col][i], str) else data[col][i])
               for col in data}
        db.session.add(table(**row))
    db.session.commit()


def _add_column_if_missing(table: str, column: str, definition: str):
    """Add a column to an existing table if it does not already exist.
    Uses INFORMATION_SCHEMA so it is safe to call on every startup.
    """
    exists = db.session.execute(db.text(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {'table': table, 'column': column}).scalar()
    if not exists:
        db.session.execute(db.text(
            f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}"
        ))
        db.session.commit()


def init_db():
    db.create_all()
    _add_column_if_missing('users', 'image_filename', 'VARCHAR(255) NULL')
    _add_column_if_missing('auction_listings', 'image_filename', 'VARCHAR(255) NULL')
    db.session.execute(db.text("SET FOREIGN_KEY_CHECKS=0"))

    if ZipcodeInfo.query.first() is None:
        d = parse("testdb/Zipcode_Info.csv")
        seed(ZipcodeInfo, d, len(d['zipcode']))

    if Address.query.first() is None:
        d = parse("testdb/Address.csv", type_map={"street_num": int})
        seed(Address, d, len(d['address_id']))

    if Users.query.first() is None:
        d = parse("testdb/Users.csv")
        for i in range(len(d['email'])):
            d['password'][i] = hashlib.sha256(d['password'][i].encode()).hexdigest()
        seed(Users, d, len(d['email']))

    if Helpdesk.query.first() is None:
        raw = parse("testdb/Helpdesk.csv")
        d = {'email': raw['email'], 'position': raw['Position']}
        seed(Helpdesk, d, len(d['email']))

    if Bidders.query.first() is None:
        d = parse("testdb/Bidders.csv", type_map={"age": int})
        seed(Bidders, d, len(d['email']))

    if Sellers.query.first() is None:
        d = parse("testdb/Sellers.csv", type_map={"balance": float})
        seed(Sellers, d, len(d['email']))

    if LocalVendors.query.first() is None:
        raw = parse("testdb/Local_Vendors.csv")
        d = {
            'email': raw['Email'],
            'business_name': raw['Business_Name'],
            'business_address_id': raw['Business_Address_ID'],
            'customer_service_phone_number': raw['Customer_Service_Phone_Number'],
        }
        seed(LocalVendors, d, len(d['email']))

    if CreditCards.query.first() is None:
        raw = parse("testdb/Credit_Cards.csv",
                    type_map={"expire_month": int, "expire_year": int})
        d = {
            'credit_card_num': raw['credit_card_num'],
            'card_type': raw['card_type'],
            'expire_month': raw['expire_month'],
            'expire_year': raw['expire_year'],
            'security_code': raw['security_code'],
            'owner_email': raw['Owner_email'],
        }
        seed(CreditCards, d, len(d['credit_card_num']))

    if Requests.query.first() is None:
        d = parse("testdb/Requests.csv",
                  type_map={"request_id": int, "request_status": int})
        seed(Requests, d, len(d['request_id']))

    if Categories.query.first() is None:
        raw = parse("testdb/Categories.csv")
        csv_names = set(raw['category_name'])
        csv_parents = set(p for p in raw['parent_category'] if p is not None)
        # Categories that appear only as parents in the CSV have no row of their own
        # they are top-level and should sit directly under the 'All' root.
        top_level = csv_parents - csv_names

        db.session.add(Categories(category_name='All', parent_category=None))
        for cat in top_level:
            db.session.add(Categories(category_name=cat, parent_category='All'))
        for i in range(len(raw['category_name'])):
            db.session.add(Categories(
                category_name=raw['category_name'][i],
                parent_category=raw['parent_category'][i],
            ))
        db.session.commit()

    if AuctionListings.query.first() is None:
        raw = parse("testdb/Auction_Listings.csv",
                    type_map={"Listing_ID": int, "Quantity": int,
                              "Reserve_Price": 'price', "Max_bids": int, "Status": int})
        d = {
            'seller_email': raw['Seller_Email'],
            'listing_id': raw['Listing_ID'],
            'category': raw['Category'],
            'auction_title': raw['Auction_Title'],
            'product_name': raw['Product_Name'],
            'product_description': raw['Product_Description'],
            'quantity': raw['Quantity'],
            'reserve_price': raw['Reserve_Price'],
            'max_bids': raw['Max_bids'],
            'status': raw['Status'],
        }
        seed(AuctionListings, d, len(d['seller_email']))

    if Bids.query.first() is None:
        raw = parse("testdb/Bids.csv",
                    type_map={"Bid_ID": int, "Listing_ID": int, "Bid_Price": float})
        d = {
            'bid_id': raw['Bid_ID'],
            'seller_email': raw['Seller_Email'],
            'listing_id': raw['Listing_ID'],
            'bidder_email': raw['Bidder_Email'],
            'bid_price': raw['Bid_Price'],
        }
        seed(Bids, d, len(d['bid_id']))

    if Transactions.query.first() is None:
        raw = parse("testdb/Transactions.csv",
                    type_map={"Transaction_ID": int, "Listing_ID": int,
                              "Payment": float, "Date": 'date'})
        d = {
            'transaction_id': raw['Transaction_ID'],
            'seller_email': raw['Seller_Email'],
            'listing_id': raw['Listing_ID'],
            'buyer_email': raw['Bidder_Email'],
            'date': raw['Date'],
            'payment': raw['Payment'],
        }
        seed(Transactions, d, len(d['transaction_id']))

    if Ratings.query.first() is None:
        raw = parse("testdb/Ratings.csv",
                    type_map={"Rating": int, "Date": 'date'})
        d = {
            'bidder_email': raw['Bidder_Email'],
            'seller_email': raw['Seller_Email'],
            'date': raw['Date'],
            'rating': raw['Rating'],
            'rating_desc': raw['Rating_Desc'],
        }
        seed(Ratings, d, len(d['bidder_email']))

    db.session.execute(db.text("SET FOREIGN_KEY_CHECKS=1"))
    db.session.commit()
