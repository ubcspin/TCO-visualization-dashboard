const resize = () => {
    const width = d3.max([window.innerWidth, 1600]);
    let height = d3.max([window.innerHeight, 900]);
    if (width / height < 1.6 && width / height > 1.9) {
        height = width * 9 / 16;
    }

    const photos = document.querySelectorAll("#gallery-container img");
    for (let i = 0; i < photos.length; i++) {
        photos.item(i).setAttribute("style", "height: " + (height / 3) + "px; margin: " + (height * 0.02) + "px")
    }

    document.getElementById("dashboard").setAttribute("style", "width: " + width + "px; height: " + height + "px; font-size: " + (width * 100 / 1920) + "%");
};

window.onresize = resize;

window.onload = () => {
    d3.json('data/photos.json').then(photos => {
        document.getElementById("dashboard-button").onclick = () => {
            location.href = "index.html"
        }

        const container = document.getElementById("gallery-container");
        photos.forEach(p => {
            const photo = document.createElement("img");
            photo.src = p.path;
            photo.classList.add(p.reproduced ? "reproduced" : "original");
            container.appendChild(photo);
        });
    
        resize();
    });
};