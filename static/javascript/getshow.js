document.addEventListener("DOMContentLoaded", function () {
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
            setPlayer(play_url);
        }
        else {
            window.open(play_url, "_blank");
        }
    }
    // adding event listener to episode containers
    window.set_episode = (ep_elem, e_id) => {
        [...document.getElementsByClassName("active")].forEach(elem => elem.classList.toggle("active"));
        ep_elem.classList.toggle("active");
        window.setPlayer = (stream_url) => {
            var video = document.querySelector('#player');

            if (Hls.isSupported()) {
                var hls = new Hls();
                hls.loadSource(stream_url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    video.play();
                });
            }

            plyr.setup(video);
        }

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
});
