from flask import Blueprint

home_bp = Blueprint("home", __name__)

@home_bp.route("/home", methods = ["GET"])
def home():
    return