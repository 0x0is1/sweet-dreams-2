document.addEventListener("DOMContentLoaded", function () {
    var loadingDiv = document.getElementById('loading');

    window.showSpinner = function () {
        loadingDiv.style.visibility = 'visible';
    }

    window.hideSpinner = function () {
        loadingDiv.style.visibility = 'hidden';
    }

    window.showSpinner();

    const data = window.seasonData;
    let list = JSON.parse(data);

    // setting season list
    list.forEach(data => {
        let opt = document.getElementById("selectbox");
        let opt_box = document.createElement("option");
        opt_box.setAttribute("value", list.indexOf(data));
        if (data.name.length < 1) {
            opt_box.innerText = data.series.post_title;
        }
        else {
            opt_box.innerText = data.name;
        }
        opt.appendChild(opt_box);
    });

    window.selectChanged = (elem) => {
        let series_index = elem.value;
        let container = document.getElementById("container");
        container.innerHTML = null;
        list[series_index].episodes.all.reverse().forEach(ep_data => {
            let ep_container = document.createElement("div");
            ep_container.className = "episode-container";
            ep_container.setAttribute("title", ep_data.title);
            ep_container.setAttribute("description", list[series_index].series.post_content);
            ep_container.setAttribute("published", new Date(parseInt(ep_data.metadata.released) * 1000).toLocaleString());
            ep_container.setAttribute("onclick", `set_episode(this, ${ep_data.id})`);
            let ep_count_node = document.createElement("span");
            ep_count_node.className = "ep-count";
            ep_count_node.innerText = ep_data.metadata.number;
            let name_node = document.createElement("span");
            name_node.className = "ep-name";
            name_node.innerText = ep_data.title;
            ep_container.appendChild(ep_count_node);
            ep_container.appendChild(name_node);
            container.appendChild(ep_container);
        });
    }

    window.selectPlayerTypeChanged = (elem) => {
        // embed server selector
        const player_data = window.ep_res[elem.value];
        let opt = document.getElementById("selectbox-svtype");
        opt.innerHTML = null;
        player_data.forEach(ptdata => {
            let opt_box = document.createElement("option");
            opt_box.setAttribute("value", ptdata.url);
            opt_box.innerText = `${ptdata.language} (${ptdata.quality}) [${ptdata.server}]`;
            if (elem.value == "internal_stream_players") {
                opt_box.setAttribute("playable", true)
            }
            else {
                opt_box.setAttribute("playable", false);
            }
            opt.appendChild(opt_box);
        });
        window.selectorServer.Update();
    }

    window.selectServerTypeChanged = (elem) => {
        const play_url = elem.value;
        const playeble = JSON.parse(elem.getElementsByTagName("option")[0].getAttribute("playable"));
        if (playeble) {
            window.showSpinner();
            setPlayer(play_url);
        }
        else {
            window.open(play_url, "_blank");
        }
    }

    window.setDefaultEpisode = () => {
        try {
            var lastPlayer = parseInt(window.localStorage.getItem("lastPlayer"));
            lastPlayer = lastPlayer === -1 ? 1 : lastPlayer;
            var lastPlayed = parseFloat(window.localStorage.getItem("lastPlayed")) || 0.0;
            document.getElementsByClassName('bv_ul_inner')[1].children[3].click();
            document.getElementsByClassName('bv_ul_inner')[2].children[lastPlayer].click();
            document.getElementsByTagName("video")[0].currentTime = lastPlayed;
        } catch (error) {
            console.log(error);
        }
        window.hideSpinner();
    }

    // adding event listener to episode containers
    window.setPlayer = (stream_url) => {
        var video = document.getElementById('player');

        if (window.Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(stream_url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                window.hideSpinner();
                video.play();
            });
        }

        plyr.setup(video);
    }
    window.set_episode = (ep_elem, e_id) => {
        document.getElementsByTagName("video")[0].pause();
        window.showSpinner();
        [...document.getElementsByClassName("active")].forEach(elem => elem.classList.toggle("active"));
        ep_elem.classList.toggle("active");
        
        function resp(data) {
            document.getElementsByTagName("video")[0].style.display = "block";
            window.ep_res = JSON.parse(data);

            // embed show details
            let elem = ep_elem;
            document.getElementById("ep-title").innerText = elem.getAttribute("title");
            document.getElementById("ep-description").innerHTML = elem.getAttribute("description");
            document.getElementById("ep-published").innerText = elem.getAttribute("published");

            // embed player selector
            let opt = document.getElementById("selectbox-ptype");
            opt.innerText = null;
            Object.keys(window.ep_res).forEach(element => {
                let opt_box = document.createElement("option");
                opt_box.setAttribute("value", element);
                opt_box.innerText = element.replaceAll("_", " ");
                opt.appendChild(opt_box);
            });
            window.selectorPlayer.Update();
            window.setDefaultEpisode();
        }

        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                resp(xhr.responseText);
            }
        };
        xhr.open("GET", `/fetchep?gep_id=${e_id}`, true);
        xhr.send();
    }

    window.selectorSeason = new BVSelect({
        selector: "#selectbox",
        width: "90%",
        searchbox: true,
        offset: true,
        placeholder: "Select Option",
        search_placeholder: "Search...",
        search_autofocus: true,
        breakpoint: 450
    });

    window.selectorPlayer = new BVSelect({
        selector: "#selectbox-ptype",
        width: "80%",
        searchbox: true,
        offset: true,
        placeholder: "Select Option",
        search_placeholder: "Search...",
        search_autofocus: true,
        breakpoint: 450
    });

    window.selectorServer = new BVSelect({
        selector: "#selectbox-svtype",
        width: "80%",
        searchbox: true,
        offset: true,
        placeholder: "Select Option",
        search_placeholder: "Search...",
        search_autofocus: true,
        breakpoint: 450
    });
    window.select_default_ep = () => {
        try {
            var lastSeason = parseInt(window.localStorage.getItem("lastSeason"));
            lastSeason = lastSeason === -1 ? 0 : lastSeason;
            var lastEpisode = parseInt(window.localStorage.getItem("lastEpisode"));
            lastEpisode = lastEpisode === -1 ? 0 : lastEpisode;
            document.getElementsByClassName('bv_ul_inner')[0].children[lastSeason + 2].click();
            document.getElementsByClassName('episode-container')[lastEpisode].click();
        } catch (e) {
            console.log(e);
        }
    }
    window.select_default_ep();

    setInterval(() => {
        let lastPlayed = document.getElementsByTagName("video")[0].currentTime;
        let lastSeason = document.getElementsByTagName("select")[0].options.selectedIndex-1;
        let lastEpisode = [...document.getElementsByClassName("episode-container")].indexOf(document.getElementsByClassName("active")[0]);
        let lastPlayer = document.getElementsByTagName("select")[2].options.selectedIndex-1;
        window.localStorage.setItem("lastSeason", lastSeason);
        window.localStorage.setItem("lastEpisode", lastEpisode);
        window.localStorage.setItem("lastPlayer", lastPlayer);
        window.localStorage.setItem("lastPlayed", lastPlayed);
    }, 6000);
});
