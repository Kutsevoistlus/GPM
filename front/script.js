$('.icon').onClick(function () {
    $('.search').toggleClass('expanded');
});




const xValues = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
const yValues = [15, 6, 14, 7, 13, 8, 12, 9, 11, 10, 10];

let graph = new Chart("myChart", {
    type: "line",
    data: {
        labels: xValues,
        datasets: [{
            fill: false,
            lineTension: 0,
            backgroundColor: "blue",
            borderColor: "black",
            data: yValues
        }]
    },
    options: {
        legend: {display: false},
        scales: {
            yAxes: [{ticks: {min: 10, max:300}}],
        }
    }
});

let prices = [];
let highlights = {};

function createHighlight(time, type) {
    let container = document.querySelector(".consumption-container");
    let div = document.createElement("div");
    div.classList.add("consumption-highlight");
    div.style.width = container.clientWidth/24+"px";
    div.style.marginLeft = container.clientWidth/24*time+"px";
    if(time === 0) {
        div.style.borderTopLeftRadius = "100%";
        div.style.borderBottomLeftRadius = "100%";
    }
    if(time === 23) {
        div.style.borderTopRightRadius = "100%";
        div.style.borderBottomRightRadius = "100%";
    }
    type === "good" ? div.style.backgroundColor = "#3EEF7A" : div.style.backgroundColor = "#E14F4F";
    container.appendChild(div);
    let text = document.createElement("span");
    text.classList.add("consumption-highlight-text");
    text.textContent = time+":00";
    div.appendChild(text);
    text.style.right = text.offsetWidth/2+"px";
}

fetch("http://localhost:3000/prices").then(res => res.json()).then(function(e){prices = e});
fetch("http://localhost:3000/prices/highlights").then(res => res.json()).then(function(e){highlights = e; showData()});
function showData(){
    let array = [];
    for(let i = 0; i<24; i++) {
        array.push(i+":00");
    }
    graph.data.labels = array;
    graph.data.datasets[0].data = prices;
    graph.update();
    document.querySelector("#hour-price").textContent = highlights.current+"€/kWh"
    document.querySelector("#min-price").textContent = highlights.min+"€/kWh"
    document.querySelector("#max-price").textContent = highlights.max+"€/kWh"
    document.querySelector("#avg-price").textContent = highlights.avg+"€/kWh"
    for(let i in highlights.low) {
        createHighlight(highlights.low[i], "good");
    }
    for(let i in highlights.high) {
        createHighlight(highlights.high[i], "bad");
    }
}