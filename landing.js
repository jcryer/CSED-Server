//lookup tables for converting moods to abstract moods
//abstract mood = lookup[real mood]
//lookups are as follows
/*
    0) Happy
    0: Neutral
    1: Happy
    5: Exuberant
    7: Joyful
    
    1) Calm
    3: Calm
    8: Contentment
    9: Relaxing
    13: For Concentration
    14: Motivational
    
    2) Lively
    6: Lively
    10: Frantic
    4: Energetic

    3) Sad
    2: Sad
    11: Depressing
    12: Melancholic
*/
const MOOD_LOOKUP = [0, 0, 3, 2, 0, 2, 0, 1, 1, 2, 3, 3, 1, 1];


$(document).ready(function() {

    //Loads google charts
    google.charts.load('current', {'packages':['corechart']});
    //Draws charts once charts api has loaded
    google.charts.setOnLoadCallback(function () {
        drawYesterday();
        drawMonth();
    })

    function drawYesterday() {
        //tmp for testin
        var datain = JSON.parse('[{"hour":10,"mood":0},{"hour":12,"mood":4},{"hour":9,"mood":2},{"hour":11,"mood":7},{"hour":9,"mood":0},{"hour":10,"mood":0},{"hour":11,"mood":10},{"hour":10,"mood":4},{"hour":5,"mood":10},{"hour":9,"mood":10},{"hour":11,"mood":10},{"hour":9,"mood":0},{"hour":11,"mood":0},{"hour":12,"mood":4},{"hour":10,"mood":10},{"hour":10,"mood":4},{"hour":11,"mood":1},{"hour":10,"mood":4},{"hour":11,"mood":4},{"hour":9,"mood":0},{"hour":12,"mood":0},{"hour":11,"mood":10},{"hour":12,"mood":2},{"hour":10,"mood":10},{"hour":9,"mood":4},{"hour":12,"mood":10},{"hour":10,"mood":4},{"hour":12,"mood":0},{"hour":14,"mood":4},{"hour":14,"mood":5},{"hour":18,"mood":4},{"hour":16,"mood":6},{"hour":16,"mood":0},{"hour":14,"mood":4},{"hour":15,"mood":0},{"hour":15,"mood":2},{"hour":15,"mood":0},{"hour":16,"mood":0},{"hour":14,"mood":4},{"hour":16,"mood":4},{"hour":20,"mood":5},{"hour":20,"mood":4},{"hour":20,"mood":10},{"hour":20,"mood":0},{"hour":20,"mood":4},{"hour":21,"mood":4}]');

        //Gets data from server
        //Does this have to be AJAX?
        //CHANGE THIS FOR PROD OR I WILL HURT YOU
        $.get("/api/recentmoods", function(data, status) {
            //probably this
            //I'm not sure tbh
            datain = JSON.parse(data);
        })

        //Creates array for data
        var data = new Array(25);
        data[0] = ['Time', 'Happy', 'Calm', 'Lively', 'Sad']
        //Iterate through hours, adding all to the array
        for (var i = 0; i < 25; i ++) {
            //Creates blank collum for each hour, and formats hour nicely
            data[i + 1] = [(i < 10 ? "0" + i.toString() : i.toString()) + ":00"
                , 0, 0, 0, 0];
        }

        //iterates over all songs
        datain.forEach(function(song) {
            //values have to be incremented as headers are in pos 0
            data[song.hour + 1][MOOD_LOOKUP[song.mood] + 1] ++;
        });

        var options = {
            title: 'Moods you listened to yesterday',
            hAxis: {titleTextStyle: {color: '#333'}, showTextEvery:2},
            //hides the v axis font
            vAxis: {minValue: 0, textStyle: {color: 'white', fontName: "monospace", fontSize: 0}},
            isStacked: true,
            enableInteractivity: false
        };

        //TODO
        //Jqueryise this???
        var chart = new google.visualization.AreaChart(document.getElementById('listening-yesterday'));
        chart.draw(google.visualization.arrayToDataTable(data), options);
    }

    function drawMonth() {
       //tmp for testin
       var datain = JSON.parse('[{"hour":10,"mood":0},{"hour":12,"mood":4},{"hour":9,"mood":2},{"hour":11,"mood":7},{"hour":9,"mood":0},{"hour":10,"mood":0},{"hour":11,"mood":10},{"hour":10,"mood":4},{"hour":5,"mood":10},{"hour":9,"mood":10},{"hour":11,"mood":10},{"hour":9,"mood":0},{"hour":11,"mood":0},{"hour":12,"mood":4},{"hour":10,"mood":10},{"hour":10,"mood":4},{"hour":11,"mood":1},{"hour":10,"mood":4},{"hour":11,"mood":4},{"hour":9,"mood":0},{"hour":12,"mood":0},{"hour":11,"mood":10},{"hour":12,"mood":2},{"hour":10,"mood":10},{"hour":9,"mood":4},{"hour":12,"mood":10},{"hour":10,"mood":4},{"hour":12,"mood":0},{"hour":14,"mood":4},{"hour":14,"mood":5},{"hour":18,"mood":4},{"hour":16,"mood":6},{"hour":16,"mood":0},{"hour":14,"mood":4},{"hour":15,"mood":0},{"hour":15,"mood":2},{"hour":15,"mood":0},{"hour":16,"mood":0},{"hour":14,"mood":4},{"hour":16,"mood":4},{"hour":20,"mood":5},{"hour":20,"mood":4},{"hour":20,"mood":10},{"hour":20,"mood":0},{"hour":20,"mood":4},{"hour":21,"mood":4}]');

       //Gets data from server
       //Does this have to be AJAX?
       //CHANGE THIS FOR PROD OR I WILL HURT YOU
       //THIS will have to change for the month view as well
       $.get("/api/recentmoods", function(data, status) {
           console.log(data);
       })

       //Creates array for data
       var data = new Array(31);
       data[0] = ['Time', 'Happy', 'Calm', 'Lively', 'Sad']
       //Iterate through hours, adding all to the array
       for (var i = -30; i < 0; i ++) {
           //Creates blank collum for each hour, and formats hour nicely
           data[31 + i] = [i.toString(), 0, 0, 0, 0];
        }
        data[31] = ["Today", 0, 0, 0, 0];

       //iterates over all songs
       datain.forEach(function(song) {
           //values have to be incremented as headers are in pos 0
           data[/*obv this has to be changed*/ song.hour + 1][MOOD_LOOKUP[song.mood] + 1] ++;
       });

       var options = {
           title: 'How your moods have changed over the last 30 days',
           hAxis: {titleTextStyle: {color: '#333'}, showTextEvery:2},
           //hides the v axis font
           vAxis: {minValue: 0, textStyle: {color: 'white', fontName: "monospace", fontSize: 0}},
           isStacked: "relative",
           enableInteractivity: false
       };

       var chart = new google.visualization.AreaChart(document.getElementById('listening-month'));
       chart.draw(google.visualization.arrayToDataTable(data), options);
    }
})