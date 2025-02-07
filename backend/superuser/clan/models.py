from datetime import datetime
from pydantic import BaseModel


class Id(BaseModel):
    id = str

class ClanModel(BaseModel):
    clan_name: str
    creator: str
    in_clan_rank: int
    total_coin: int
    created_at: datetime
    status: str

    class Config:
        orm_mode = True
