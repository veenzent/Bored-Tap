from asyncio import ALL_COMPLETED
from datetime import datetime
from enum import Enum
from tkinter import ACTIVE
from pydantic import BaseModel


class ClanStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    DISABLED =  "disabled"

    def __repr__(self) -> str:
        return self.value

class ClanCategory(str, Enum):
    ALL_CLANS= "all_clans"
    ACTIVE = "active"
    PENDING_APPROVAL = "pending_approval"
    DISBANDED =  "disbanded"

    def __repr__(self) -> str:
        return self.value


class CreateClan(BaseModel):
    clan_name: str
    clan_image: str
    clan_members: dict[str, dict[str, str]]