##Follow the structure to import blueprints: from .{filename} import {blueprint_name}
from .home import home_bp
from .login import login_bp

blueprints = [home_bp, login_bp]