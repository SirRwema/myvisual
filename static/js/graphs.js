d3.queue()
    .defer(d3.json, "/uganda/report")
    .defer(d3.json, "static/geojson/uganda_districts_2011_005.json")
    .await(makeGraphs);

function makeGraphs(error, fatalincidentsJson, DNameJson) {
	
	//Clean projectsJson data
	var ugandaReport = fatalincidentsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");

	ugandaReport.forEach(function(d) {
		d["EVENT_DATE"] = dateFormat.parse(d["EVENT_DATE"]);
		d["EVENT_DATE"].setDate(1);
		d["FATALITIES"] = +d["FATALITIES"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(ugandaReport);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["EVENT_DATE"]; });
	var actorsDim = ndx.dimension(function(d) { return d["ACTOR1"]; });
	var sourceDim = ndx.dimension(function(d) { return d["SOURCE"]; });
	var DistrictDim = ndx.dimension(function(d) { return d["LOCATION"]; });
	var totalFatalitiesDim  = ndx.dimension(function(d) { return d["FATALITIES"]; });


	//Calculate metrics
	var numActorsByDate = dateDim.group(); 
	var numFatalitiesByActorsType = actorsDim.group();
	var numReportsBySource = sourceDim.group();
	var totalFatalitiesByDistrict = DistrictDim.group().reduceSum(function(d) {
		return d["FATALITIES"];
	});

	var all = ndx.groupAll();
	var totalfatalities = ndx.groupAll().reduceSum(function(d) {return d["FATALITIES"];});

	var max_dist = totalFatalitiesByDistrict.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["EVENT_DATE"];
	var maxDate = dateDim.top(1)[0]["EVENT_DATE"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var actorsTypeChart = dc.rowChart("#actors-type-row-chart");
	var sourceLevelChart = dc.rowChart("#source-level-row-chart");
	var ugChart = dc.geoChoroplethChart("#ug-chart");
	var numberActorsND = dc.numberDisplay("#actors-projects-nd");
	var totalFatalitiesND = dc.numberDisplay("#total-fatalities-nd");

	numberActorsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	totalFatalitiesND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(totalfatalities)
		.formatNumber(d3.format(".3s"));

	timeChart
		.width(600)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numActorsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(4);

	actorsTypeChart
        .width(300)
        .height(250)
        .dimension(actorsDim)
        .group(numFatalitiesByActorsType)
        .xAxis().ticks(4);

	sourceLevelChart
		.width(300)
		.height(250)
        .dimension(sourceDim)
        .group(numReportsBySource)
        .xAxis().ticks(4);


	ugChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(totalFatalitiesByDistrict)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_dist])
		.overlayGeoJson(DNameJson["features"], "district", function (d) {
			return d.properties.name;
		})
		.projection(d3.geo.albers()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "District: " + p["key"]
					+ "\n"
					+ "Total Fatalities: " + Math.round(p["value"]) + " $";
		})

    dc.renderAll();

};