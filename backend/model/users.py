from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, ForeignKey


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, primary_key=True)
    password: Mapped[str] = mapped_column(String, nullable=False)


class Bidder(Base):
    __tablename__ = "bidders"

    email: Mapped[str] = mapped_column(String, ForeignKey("users.email"), primary_key=True)


class Seller(Base):
    __tablename__ = "sellers"

    email: Mapped[str] = mapped_column(String, ForeignKey("users.email"), primary_key=True)


class Helpdesk(Base):
    __tablename__ = "helpdesk"

    email: Mapped[str] = mapped_column(String, ForeignKey("users.email"), primary_key=True)
