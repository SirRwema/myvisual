from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'violenceUG'
COLLECTION_NAME = 'fatalincidents'
FIELDS = { 'LOCATION':True, 'SOURCE':True, 'EVENT_DATE':True, 'ACTOR1':True, 'FATALITIES':True, 'YEAR':True, '_id':False}



@app.route("/")
def index():
    return render_template("index.html")


@app.route("/uganda/report")
def uganda_report():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    fatalincidents = collection.find(projection=FIELDS)
    #projects = collection.find(projection=FIELDS)
    json_fatalincidents = []
    for incident in fatalincidents:
        json_fatalincidents.append(incident)
    json_fatalincidents = json.dumps(json_fatalincidents, default=json_util.default)
    connection.close()
    return json_fatalincidents

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)