// Global variables for analytics
var analytics = {
	chartType: null,
	chartData: null
};

$(function() {
	$(window).resize(function() {
		switch (analytics.chartType) {
			case "bar":
				drawBarChart(analytics.chartData);
				break;
			case "pie":
				drawPieChart(analytics.chartData);
				break;
		}
	});
	loadGeneralStats();
});

function resetAnalyticsChart() {
	analytics.chartType = null;
	analytics.chartData = null;
	clearCanvas($("#analytic-chart")[0]);
}

function loadAnalytics(q, cb) {
	$.ajax({
		url: "analytictoolservice.php",
		type: "POST",
		dataType: "json",
		data: {query: q},
		success: function(data) {
			$("#analytic-data").empty();
			$("#analytic-data").append("<pre>" + JSON.stringify(data, null, 4));
			resetAnalyticsChart();
			$('#analytic-info').empty();
			cb(data);
		}
	});
}

function loadGeneralStats() {
	loadAnalytics("generalStats", function(data) {
	});
}

function loadPasswordGuessing() {
	loadAnalytics("passwordGuessing", function(data) {
	});
}

function loadOsPercentage() {
	loadAnalytics("osPercentage", function(data) {
		var chartData = [];
		for (var i = 0; i < data.length; i++) {
			chartData.push({
				label: data[i].operatingSystem,
				value: data[i].percentage
			});
		}
		drawPieChart(chartData);
	});
}

function loadBrowserPercentage() {
	loadAnalytics("browserPercentage", function(data) {
	});
}

function loadServiceUsage() {
	loadAnalytics("serviceUsage", function(data) {
	});
}

function loadServiceAvgDuration() {
	$('#analytic-info').html("The average duration of service call completion in milliseconds.");
	loadAnalytics("serviceAvgDuration", function(data) {
		var chartData = [];
		for (var i = 0; i < data.length; i++) {
			chartData.push({
				label: data[i].service,
				value: data[i].avgDuration
			});
		}
		drawBarChart(chartData);
	});
}

function loadServiceCrashes() {
	loadAnalytics("serviceCrashes", function(data) {
	});
}

function fitCanvasToContainer(canvas){
	canvas.style.width="100%";
	canvas.style.height="100%";
	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
}

function clearCanvas(canvas) {
	var ctx = canvas.getContext("2d");
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function chartDataMax(data) {
	var max = 0;
	$.each(data, function(i, obj) {
		if (max < Number(obj.value)) max = Number(obj.value);
	});
	return max;
}

function chartDataLongestLabelWidth(data, ctx) {
	var longest = 0;
	$.each(data, function(i, obj) {
		if (longest < ctx.measureText(obj.label).width) longest = ctx.measureText(obj.label).width
	});
	return longest;
}

function drawBarChart(data) {
	if (!$.isArray(data)) return;

	analytics.chartType = "bar";
	analytics.chartData = data;

	var canvas = $("#analytic-chart")[0];
	var ctx = canvas.getContext("2d");

	fitCanvasToContainer(canvas);
	clearCanvas(canvas);
	
	var barWidth = 40;
	var fontSize = 12;
	ctx.font = fontSize + "px Arial";
	ctx.textAlign = "center";
	ctx.translate(0, canvas.height);

	var barSpacing = chartDataLongestLabelWidth(data, ctx) - barWidth + 10;
	barSpacing = barSpacing > 50 ? barSpacing : 50;
	var textAreaHeight = fontSize * 2.2;
	var barHeightMultiplier = (canvas.height - textAreaHeight) / chartDataMax(data);
	
	for (var i = 0; i < data.length; i++) {
		var x = barSpacing + i * (barWidth + barSpacing);
		ctx.fillStyle = "#614875";
		ctx.scale(1, -1);
		ctx.fillRect(x, textAreaHeight, barWidth, data[i].value * barHeightMultiplier);
		ctx.scale(1, -1);
		ctx.fillStyle = "white";
		ctx.fillText(Number(data[i].value).toFixed(0), x + barWidth / 2, -data[i].value * barHeightMultiplier);
		ctx.fillStyle = "black";
		ctx.fillText(data[i].label, x + barWidth / 2, -textAreaHeight / 2);
	}
}

function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function drawPieChart(data) {
	if (!$.isArray(data)) return;

	analytics.chartType = "pie";
	analytics.chartData = data;

	var canvas = $("#analytic-chart")[0];
	var ctx = canvas.getContext("2d");

	fitCanvasToContainer(canvas);
	clearCanvas(canvas);

	var total = 0;
	for (var i = 0; i < data.length; i++) {
		total += (isNaN(data[i].value)) ? 0 : Number(data[i].value);
	}

	var fontSize = 14;
	var textAreaHeight = fontSize * 2.2;
	var radius = canvas.height / 2;
	var last = 0;
	for (var i = 0; i < data.length; i++) {
		ctx.fillStyle = getRandomColor();
		ctx.beginPath();
		ctx.moveTo(radius, radius);
		ctx.arc(radius, radius, radius, last, last + (Math.PI*2*(data[i].value/total)), false);
		ctx.lineTo(radius, radius);
		ctx.fill();
		last += (Math.PI*2*(data[i].value/total));

		ctx.fillRect(radius * 2 + 30, i * textAreaHeight + 20, 12, 12);
		ctx.fillStyle = "black";
		ctx.font = fontSize + "px Arial";
		ctx.fillText(data[i].label, radius * 2 + 50, i * textAreaHeight + textAreaHeight);
	}
}
