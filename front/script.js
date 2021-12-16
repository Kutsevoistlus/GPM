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
let currentPrice = 0;
fetch("http://localhost:3000/prices").then(res => res.json()).then(function(e){prices = e; currentPrice = prices[new Date().getHours()]});
setTimeout(function(){
    let array = [];
    for(let i = 0; i<24; i++) {
        array.push(i+":00");
    }
    graph.data.labels = array;
    graph.data.datasets[0].data = prices;
    graph.update();
    document.querySelector("#hour-price").textContent = currentPrice+"€/MWh"
    },150)