from flask import Flask
from routes import blueprints
from flask_cors import CORS
import os
import pymysql
from database import db
from seed import init_db
from services.image_service import ensure_default_image
pymysql.install_as_MySQLdb()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-change-in-prod')
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

db.init_app(app)

with app.app_context():
    init_db()
    ensure_default_image()
    for blueprint in blueprints:
        app.register_blueprint(blueprint)
