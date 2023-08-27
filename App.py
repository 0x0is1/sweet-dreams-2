from lib.parser import SDParser
from flask import Flask, render_template, request
from threading import Thread


parser = SDParser()
app = Flask(__name__)

@app.route("/")
def home():
    page = request.args.get('page', default=1)
    show_list = parser.get_list_all(page)
    return render_template("home.html", show_list=show_list, page=page)

def run():
  app.run(host='0.0.0.0',port=8899)

def wsv():  
    t = Thread(target=run)
    t.start()

@app.route("/getshow", methods=['GET'])
def getShow():
    url = request.args.get('url')
    return render_template("getshow.html", show_detail=parser.parse_seasons(url))

@app.route("/fetchep", methods=["GET"])
def fetchep():
    gep_id = request.args.get("gep_id")
    return parser.fetch_episode(gep_id)

wsv()

# ep_id = parser.get_ep_id(season_lang_url)
# stream_url = parser.parse_mystream(ep_id)
# print(stream_url)

# print(json.dumps(season_link))