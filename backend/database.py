from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# O SQLite vai criar um arquivo chamado 'acessum.db' na raiz da sua pasta backend
DATABASE_URL = "sqlite:///./acessum.db"

# connect_args={"check_same_thread": False} é obrigatório no FastAPI com SQLite
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()