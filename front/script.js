const xValues = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
const yValues = [15, 6, 14, 7, 13, 8, 12, 9, 11, 10, 10];

new Chart("myChart", {
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
            yAxes: [{ticks: {min: 6, max:16}}],
        }
    }
});
