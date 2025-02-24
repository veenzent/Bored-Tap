from config import get_settings
from gridfs import GridFS
from pymongo import MongoClient, errors


connection_string: str = get_settings().mongodb_connection_string
client: MongoClient = MongoClient(connection_string)


def get_db():
    """

    """
    try:
        # ping the server to check connectivity
        client.server_info()
        db = client['bored-tap']
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e

def get_img_db():
    """

    """
    try:
        # ping the server to check connectivity
        client.server_info()
        db = client['bored-tap-images']
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e


db = get_db()
img_db = get_img_db()
fs = GridFS(img_db, collection='images')

collection_names = [
    'admins',
    'users',
    'invites_ref',
    'coin_stats',
    'tasks',
    'rewards',
    'challenges',
    'extra_boosts',
    'levels'
]

for collection_name in collection_names:
    try:
        db.create_collection(collection_name, check_exists=True,)
    except errors.CollectionInvalid:
        pass

admin_collection = db['admins']
user_collection = db['users']
invites_ref = db['invites_ref']
coin_stats = db['coin_stats']
task_collection = db['tasks']
rewards_collection = db['rewards']
challenges_collection = db['challenges']
extra_boosts_collection = db['extra_boosts']
levels_collection = db['levels']
