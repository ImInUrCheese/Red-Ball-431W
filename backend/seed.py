import csv
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session
from sqlalchemy import String, create_engine
import hashlib

def parse(file_path):
    columns = {}

    with open(file_path, mode="r", newline="", encoding="utf-8-sig") as file:
        data = csv.DictReader(file)

        for field in data.fieldnames:
            columns[field] = []

        for row in data:
            for field in data.fieldnames:
                columns[field].append(row[field])

    return columns

def seed(table, data, size, engine):
    with Session(engine) as session:
        for i in range(size):
            row = {}

            for col in data:
                value = data[col][i]
                value = value.strip()
                row[col] = value

            new_entry = table(**row)
            session.add(new_entry)

        session.commit()

class Base(DeclarativeBase):
    pass

class Users(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, primary_key=True)
    password: Mapped[str] = mapped_column(String, nullable=False)

engine = create_engine("sqlite:///redball.db", echo=True)
Base.metadata.create_all(engine)

users_data = parse("testdb/Users.csv") #parses users.csv
users_size = len(users_data['email']) #the amount of entries in users

#hashes the passwords
for i in range(users_size):
    users_data['password'][i] = hashlib.sha256(users_data['password'][i].encode()).hexdigest()

seed(Users, users_data, users_size, engine)
