const express = require('express');
require('dotenv');
const axios = require('axios');

function getToday() {
    let today = new Date();
    today.setHours(0,0,0,0);
    return today;
}

function addDay(givenDay) {
    let newDay = new Date(givenDay);
    newDay.setDate(newDay.getDate() + 1);
    return newDay;
}

 function getPrices() {
    let array = [];
    let currentDate = getToday();
    let nextDate = addDay(currentDate);
    axios.get("https://dashboard.elering.ee/api/nps/price?start="+currentDate.toISOString()+"&end="+nextDate.toISOString())
        .then(function(res) {
            let resData = (res.data.data['ee']); // Select estonia price data
            resData.forEach(function(e) {array.push(e['price'])});
        })
        .catch(err => function(){console.log(err); return []})
    return array;
}

let prices = getPrices();
let pricesDate = getToday();

setInterval(function(){
    if(pricesDate.toISOString() !== getToday().toISOString() || !prices.length>0) { // If date changed or price data is empty
        prices = getPrices();
    }
},3000)