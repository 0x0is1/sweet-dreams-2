import requests
from bs4 import BeautifulSoup
import json
import base64

class SDParser:
    def __init__(self):
        self.BASE_URL = base64.b64decode('aHR0cHM6Ly9hbmltZS13b3JsZC5pbg==').decode('utf-8')
        self.all_sub_url = '/a-z-list/page/'
        # self.episode_sub_url = '/wp-json/kiranime/v1/episode/animeSeason?anime_id='
        self.episode_sub_url = '/wp-json/kiranime/v1/episode?id='
        self.mystream_url = 'https://beta.awstream.net/m3u8/{ep_id}/master.txt?s=1&cache=1'

    def get_list_all(self, page_no=1):
        container = {
            "data": []
        }
        url = f"{self.BASE_URL}{self.all_sub_url}{page_no}"
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        grep_list = "grid auto-grid-column gap-2 md:gap-4 lg:gap-5 lg:px-10"
        list_ = soup.find("div", {
            "class": grep_list
            }).find_all("div", {"class": "col-span-1"})

        for i in list_:
            grep_avatar = "absolute inset-0 object-cover w-full h-full rounded"
            grep_audio_language = "text-gray-900 bg-white rounded uppercase text-xs p-1 mr-px font-semibold"
            grep_ep_count = "text-xs px-2 py-1 rounded-md font-semibold text-text-accent bg-accent-3"
            grep_link = "text-sm line-clamp-2 font-medium leading-snug lg:leading-normal"
            grep_stype_time = "inline-block md:my-1"
            avatar_url = i.find("img", {"class": grep_avatar}).get("src")
            language = i.find("span", {"class": grep_audio_language}).text.replace("\n", "")
            ep_count = i.find("span", {"class": grep_ep_count}).text.replace("\n", "")
            link_r = i.find("a", {"class": grep_link})
            link = link_r.get("href")
            name = link_r.text.replace("\n", "")
            stype_time = i.find_all("span", {"class": grep_stype_time})
            stype = stype_time[0].text.replace("\n", "")
            time = stype_time[1].text.replace("\n", "")

            container["data"].append({
                "avatar_url": f"{self.BASE_URL}{avatar_url}",
                "language": language,
                "ep_count": ep_count,
                "link": link,
                "name": name,
                "stype": stype,
                "time": time
            })

        return container

    def get_ep_id(self, ep_url):
        response = requests.get(ep_url)
        soup = BeautifulSoup(response.content, "html.parser")
        ep_id = soup.find_all("link", {"rel": "shortlink"})[0].get("href").split("?p=")[1]
        return ep_id

    def parse_seasons(self, link: str):
        response = requests.get(link)
        soup = BeautifulSoup(response.content, 'html.parser')
        raw_data = soup.find('section', {'class': 'flex-auto w-full'}).find('script')
        return json.loads(raw_data.text.split(' = ')[1].split(';\r\n')[0].replace('\\"', '\\\\\\"'))

    def fetch_episode(self, episode_id):
        url = f'{self.BASE_URL}{self.episode_sub_url}{episode_id}'
        download_players = []
        internal_stream_players = []
        external_stream_players = []
        for i in requests.get(url).json()["players"]:
            if i["type"] == "download":
                download_players.append({
                    "language": i["language"],
                    "quality": i["quality"],
                    "server": i["server"],
                    "url": i["url"]
                })
            if i["type"] == "stream":
                if i["server"] == "Mystream":
                    internal_stream_players.append({
                        "language": i["language"],
                        "quality": i["quality"],
                        "server": i["server"],
                        "url": self.parse_mystream(i["url"])
                    })
                    continue
                external_stream_players.append({
                    "language": i["language"],
                    "quality": i["quality"],
                    "server": i["server"],
                    "url": i["url"]
                })
        
        return {
            "download_players": download_players,
            "internal_stream_players": internal_stream_players,
            "external_stream_players": external_stream_players
        } 

    def parse_mystream(self, url):
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")
        script = soup.find_all("script")[-1]
        ae_id = script.text.split('"')[3]
        return self.mystream_url.format(ep_id=ae_id)
