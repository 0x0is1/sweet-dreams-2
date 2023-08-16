from lib.parser import SDParser
from flask import Flask, render_template, request

parser = SDParser()
app = Flask(__name__)

@app.route("/")
def home():
    show_list = parser.get_list_all(1)
    return render_template("home.html", show_list=show_list)

@app.route("/getshow", methods=['GET'])
def getShow():
    url = request.args.get('url')
    return render_template("getshow.html", show_detail=parser.parse_seasons(url))

@app.route("/fetchep", methods=["GET"])
def fetchep():
    gep_id = request.args.get("gep_id")
    return parser.fetch_episode(gep_id)

app.run(debug=True)

# ep_id = parser.get_ep_id(season_lang_url)
# stream_url = parser.parse_mystream(ep_id)
# print(stream_url)

# print(json.dumps(season_link))