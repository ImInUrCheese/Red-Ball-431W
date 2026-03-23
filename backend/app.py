from flask import Flask
from routes import blueprints
from flask_cors import CORS
import os
from flask_sqlalchemy import SQLAlchemy
import pymysql
from database import db
from seed import init_db
pymysql.install_as_MySQLdb()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    init_db()
    for blueprint in blueprints:
        app.register_blueprint(blueprint)