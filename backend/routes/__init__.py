##Follow the structure to import blueprints: from .{filename} import {blueprint_name}
from .home import home_bp
from .login import login_bp
from .register import register_bp
from .helpdesk import helpdesk_bp
from .bids import bids_bp
from .listings import listings_bp
from .notifications import notifications_bp
from .ratings import ratings_bp
from .users import users_bp
from .transactions import transactions_bp

blueprints = [home_bp, login_bp, register_bp, helpdesk_bp, bids_bp, listings_bp, notifications_bp, ratings_bp, users_bp, transactions_bp]