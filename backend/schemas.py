from pydantic import BaseModel

class UsuarioBase(BaseModel):
    nome: str
    email: str
    perfil: str # 'ADMINISTRADOR', 'PROFESSOR' ou 'ALUNO'

class UsuarioCriar(UsuarioBase):
    senha: str

class UsuarioResponse(UsuarioBase):
    id: str
    status: str

    class Config:
        from_attributes = True

class LaboratorioBase(BaseModel):
    nome: str
    capacidade: int

class LaboratorioCriar(LaboratorioBase):
    pass

class LaboratorioResponse(LaboratorioBase):
    id: str
    status: str

    class Config:
        from_attributes = True