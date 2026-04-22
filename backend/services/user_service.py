from database import db
from model.users import Users, Bidders, Sellers, Helpdesk
from model.address import CreditCards
from services.image_service import save_image, get_image_url


def authenticate(email: str, password_hash: str) -> dict:
    user = db.session.get(Users, email)
    if user and user.password == password_hash:
        roles = get_roles(email)
        return {'success': True, 'roles': roles}
    return {'success': False, 'error': 'Invalid email or password'}


def get_roles(email: str) -> list:
    roles = []
    if db.session.get(Helpdesk, email):
        roles.append('helpdesk')
    if db.session.get(Sellers, email):
        roles.append('seller')
    if db.session.get(Bidders, email):
        roles.append('bidder')
    return roles

# Registration

def register_bidder(email: str, password_hash: str, first_name: str,
                    last_name: str, age: int, major: str = None,
                    home_address_id: str = None) -> dict:
    if db.session.get(Users, email):
        return {'success': False, 'error': 'Email already registered'}
    try:
        user = Users(email=email, password=password_hash)
        db.session.add(user)
        db.session.flush()  # ensure Users row exists before Bidders FK resolves
        db.session.add(Bidders(
            email=email,
            first_name=first_name,
            last_name=last_name,
            age=age,
            major=major,
            home_address_id=home_address_id,
        ))
        db.session.commit()
        return {'success': True}
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'error': str(e)}


def register_seller(email: str, password_hash: str, bank_routing_number: str,
                    bank_account_number: str) -> dict:
    if db.session.get(Users, email):
        return {'success': False, 'error': 'Email already registered'}
    try:
        user = Users(email=email, password=password_hash)
        db.session.add(user)
        db.session.flush()
        db.session.add(Sellers(
            email=email,
            bank_routing_number=bank_routing_number,
            bank_account_number=bank_account_number,
            balance=0.0,
        ))
        db.session.commit()
        return {'success': True}
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'error': str(e)}


def register_helpdesk(email: str, password_hash: str, position: str) -> dict:
    if db.session.get(Users, email):
        return {'success': False, 'error': 'Email already registered'}
    try:
        user = Users(email=email, password=password_hash)
        db.session.add(user)
        db.session.flush()
        db.session.add(Helpdesk(email=email, position=position))
        db.session.commit()
        return {'success': True}
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'error': str(e)}


# Profile reads

def get_bidder_profile(email: str) -> dict | None:
    bidder = db.session.get(Bidders, email)
    if not bidder:
        return None
    user = db.session.get(Users, email)
    return {
        'email': bidder.email,
        'first_name': bidder.first_name,
        'last_name': bidder.last_name,
        'age': bidder.age,
        'major': bidder.major,
        'home_address_id': bidder.home_address_id,
        'image_url': get_image_url(user.image_filename),
    }


def get_seller_profile(email: str) -> dict | None:
    seller = db.session.get(Sellers, email)
    if not seller:
        return None
    user = db.session.get(Users, email)
    return {
        'email': seller.email,
        'bank_routing_number': seller.bank_routing_number,
        'bank_account_number': seller.bank_account_number,
        'balance': seller.balance,
        'image_url': get_image_url(user.image_filename),
    }


def get_helpdesk_profile(email: str) -> dict | None:
    staff = db.session.get(Helpdesk, email)
    if not staff:
        return None
    user = db.session.get(Users, email)
    return {
        'email': staff.email,
        'position': staff.position,
        'image_url': get_image_url(user.image_filename),
    }


def get_payment_info(email: str) -> dict | None:
    card = CreditCards.query.filter_by(owner_email=email).first()
    if not card:
        return None
    return {
        'card_type':     card.card_type.strip(),
        'last_four':     card.credit_card_num.replace('-', '')[-4:],
        'expire_month':  card.expire_month,
        'expire_year':   card.expire_year,
    }

# Profile updates

def update_bidder_profile(email: str, first_name: str = None, last_name: str = None,
                          age: int = None, major: str = None,
                          home_address_id: str = None) -> dict:
    bidder = db.session.get(Bidders, email)
    if not bidder:
        return {'success': False, 'error': 'Bidder not found'}
    if first_name is not None:
        bidder.first_name = first_name
    if last_name is not None:
        bidder.last_name = last_name
    if age is not None:
        bidder.age = age
    if major is not None:
        bidder.major = major
    if home_address_id is not None:
        bidder.home_address_id = home_address_id
    db.session.commit()
    return {'success': True}


def update_seller_profile(email: str, bank_routing_number: str = None,
                          bank_account_number: str = None) -> dict:
    seller = db.session.get(Sellers, email)
    if not seller:
        return {'success': False, 'error': 'Seller not found'}
    if bank_routing_number is not None:
        seller.bank_routing_number = bank_routing_number
    if bank_account_number is not None:
        seller.bank_account_number = bank_account_number
    db.session.commit()
    return {'success': True}


def update_password(email: str, new_password_hash: str) -> dict:
    user = db.session.get(Users, email)
    if not user:
        return {'success': False, 'error': 'User not found'}
    user.password = new_password_hash
    db.session.commit()
    return {'success': True}


# ---------------------------------------------------------------------------
# Image upload
# ---------------------------------------------------------------------------

def upload_user_image(email: str, file) -> dict:
    """Save an uploaded profile image and store its filename on the Users row.

    Accepts .jpg, .jpeg, .png. Falls back to DefaultUserImage.jpg when no
    image has been set.

    Returns:
        {'success': True, 'image_url': '/static/images/<filename>'}
        {'success': False, 'error': '<reason>'}
    """
    user = db.session.get(Users, email)
    if not user:
        return {'success': False, 'error': 'User not found'}
    result = save_image(file)
    if not result['success']:
        return result
    user.image_filename = result['filename']
    db.session.commit()
    return {'success': True, 'image_url': get_image_url(user.image_filename)}
