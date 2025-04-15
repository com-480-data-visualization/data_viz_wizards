import CountryStatistics from './country_stats.js';

class MapPlot {

	makeColorbar(svg, color_scale, top_left, colorbar_size, scaleClass=d3.scaleLog) {

		const value_to_svg = scaleClass()
			.domain(color_scale.domain())
			.range([colorbar_size[1], 0]);

		const range01_to_color = d3.scaleLinear()
			.domain([0, 1])
			.range(color_scale.range())
			.interpolate(color_scale.interpolate());

		const colorbar_axis = d3.axisLeft(value_to_svg)
			.tickFormat(d3.format(".0f"))

		const colorbar_g = this.svg.append("g")
			.attr("id", "colorbar")
			.attr("transform", "translate(" + top_left[0] + ', ' + top_left[1] + ")")
			.call(colorbar_axis);

		function range01(steps) {
			return Array.from(Array(steps), (elem, index) => index / (steps-1));
		}

		const svg_defs = this.svg.append("defs");

		const gradient = svg_defs.append('linearGradient')
			.attr('id', 'colorbar-gradient')
			.attr('x1', '0%')
			.attr('y1', '100%')
			.attr('x2', '0%')
			.attr('y2', '0%')
			.attr('spreadMethod', 'pad');

		gradient.selectAll('stop')
			.data(range01(10))
			.enter()
			.append('stop')
				.attr('offset', d => Math.round(100*d) + '%')
				.attr('stop-color', d => range01_to_color(d))
				.attr('stop-opacity', 1);

		colorbar_g.append('rect')
			.attr('id', 'colorbar-area')
			.attr('width', colorbar_size[0])
			.attr('height', colorbar_size[1])
			.style('fill', 'url(#colorbar-gradient)')
			.style('stroke', 'black')
			.style('stroke-width', '1px')
	}

	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);
		
		this.svg
			.attr("width", "100%")
			.attr("height", "80%");

		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;

		this.countryNameMapping = {
			"United States of America": "USA",
			"United States": "USA"
		};

		const projection = d3.geoNaturalEarth1()
			.scale(170)
			.translate([this.svg_width / 2, this.svg_height / 2])
			.precision(.1);

		const path_generator = d3.geoPath()
			.projection(projection);

		const color_scale = d3.scaleLinear()
			.range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
			.interpolate(d3.interpolateHcl);

		const music_data_promise = d3.csv("https://dl.dropboxusercontent.com/scl/fi/j0yasupjf1nln4jhh40hd/final_database.csv?rlkey=gxa8cqm23y9owq1lcuuzgvub4");
		
		const map_promise = d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");

		this.createFilterControls();
		this.createNavigationBar();

		Promise.all([music_data_promise, map_promise]).then(([music_data, world_data]) => {
            this.music_data = music_data;
            this.processData(music_data);
            
            this.countryStats = new CountryStatistics(d3.select("body"), this.data_by_country);
            
            const countries = topojson.feature(world_data, world_data.objects.countries).features;
            this.updateVisualization(countries, path_generator, color_scale);
        });
	}

	processData(music_data) {
		this.data_by_country = {};
		this.genres = new Set();
		this.artists = new Set();
		this.songs = new Set();

		music_data.forEach(row => {
			const country = row.Country.trim();
			const genre = row.Genre;
			const artist = row.Artist;
			const song = row.Title;
			
			this.genres.add(genre);
			this.artists.add(artist);
			this.songs.add(song);
			
			if (!this.data_by_country[country]) {
				this.data_by_country[country] = {
					songs: [],
					popularity: 0,
					count: 0
				};
			}
			
			this.data_by_country[country].songs.push({
				title: song,
				artist: artist,
				genre: genre,
				popularity: parseFloat(row.Popularity),
				danceability: parseFloat(row.danceability),
				energy: parseFloat(row.energy),
				valence: parseFloat(row.valence),
				tempo: parseFloat(row.tempo)
			});
			
			this.data_by_country[country].popularity += parseFloat(row.Popularity);
			this.data_by_country[country].count++;
		});
		
		Object.keys(this.data_by_country).forEach(country => {
			if (this.data_by_country[country].count > 0) {
				this.data_by_country[country].popularity /= this.data_by_country[country].count;
			}
		});
	}

	createNavigationBar() {
		const navBar = d3.select("body").insert("div", "svg")
			.attr("id", "navigation-bar")
			.style("background-color", "#333")
			.style("overflow", "hidden")
			.style("margin-bottom", "10px");
			
		// Add World Map link (home)
		navBar.append("a")
			.attr("href", "#")
			.style("float", "left")
			.style("display", "block")
			.style("color", "white")
			.style("text-align", "center")
			.style("padding", "14px 16px")
			.style("text-decoration", "none")
			.text("World Map")
			.on("click", (event) => {
				event.preventDefault();
				this.showWorldMap();
			});
			
		// Add Country Statistics link
		navBar.append("a")
			.attr("href", "#")
			.style("float", "left")
			.style("display", "block")
			.style("color", "white")
			.style("text-align", "center")
			.style("padding", "14px 16px")
			.style("text-decoration", "none")
			.text("Country Statistics")
			.on("click", (event) => {
				event.preventDefault();
				this.showCountryStatistics();
			});
	}

	showWorldMap() {
		// Hide country statistics view if it exists
		d3.select("#country-stats-container").style("display", "none");
		
		// Show the map and filter controls
		d3.select("#map-plot").style("display", "block");
		d3.select("#filter-controls").style("display", "block");
		
		// Re-apply current filter to refresh the map
		this.applyFilter();
	}

	showCountryStatistics() {
        d3.select("#map-plot").style("display", "none");
        d3.select("#filter-controls").style("display", "none");
        this.countryStats.show();
    }

	createFilterControls() {
		const controlDiv = d3.select("body").insert("div", "svg")
			.attr("id", "filter-controls")
			.style("margin-bottom", "20px");
			
		controlDiv.append("h3").text("Filter Options");
		
		const filterTypeDiv = controlDiv.append("div").style("margin-bottom", "10px");
		filterTypeDiv.append("label")
			.attr("for", "filter-type")
			.text("Filter by: ");
		
		filterTypeDiv.append("select")
			.attr("id", "filter-type")
			.style("width", "200px")
			.on("change", () => this.updateFilterOptions())
			.selectAll("option")
			.data(["Genre", "Artist", "Song"])
			.enter()
			.append("option")
			.attr("value", d => d.toLowerCase())
			.text(d => d);
			
		const filterValueDiv = controlDiv.append("div").style("margin-bottom", "10px");
		filterValueDiv.append("label")
			.attr("for", "filter-value")
			.text("Select value: ");
			
		filterValueDiv.append("select")
			.attr("id", "filter-value")
			.style("width", "200px");
			
		controlDiv.append("button")
			.text("Apply Filter")
			.on("click", () => this.applyFilter());
	}

	updateFilterOptions() {
		const filterType = d3.select("#filter-type").property("value");
		const filterSelect = d3.select("#filter-value");
		
		filterSelect.selectAll("option").remove();
		
		let options;
		switch(filterType) {
			case "genre":
				options = Array.from(this.genres);
				break;
			case "artist":
				options = Array.from(this.artists);
				break;
			case "song":
				options = Array.from(this.songs);
				break;
		}
		
		options.sort();
		
		filterSelect.append("option")
			.attr("value", "all")
			.text("All");
			
		filterSelect.selectAll("option.data-option")
			.data(options)
			.enter()
			.append("option")
			.attr("class", "data-option")
			.attr("value", d => d)
			.text(d => d);
	}

	applyFilter() {
		const filterType = d3.select("#filter-type").property("value");
		const filterValue = d3.select("#filter-value").property("value");
		
		d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world_data => {
			const countries = topojson.feature(world_data, world_data.objects.countries).features;
			const path_generator = d3.geoPath().projection(
				d3.geoNaturalEarth1()
					.scale(170)
					.translate([this.svg_width / 2, this.svg_height / 2])
					.precision(.1)
			);
			
			const color_scale = d3.scaleLinear()
				.range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
				.interpolate(d3.interpolateHcl);
				
			this.updateVisualization(countries, path_generator, color_scale, filterType, filterValue);
		});
	}

	updateVisualization(countries, path_generator, color_scale, filterType = "genre", filterValue = "all") {
		this.svg.selectAll("g").remove();
		
		this.map_container = this.svg.append('g');
		this.label_container = this.svg.append('g');
		
		let country_to_popularity = {};
		
		Object.keys(this.data_by_country).forEach(country => {
			let countryData = this.data_by_country[country];
			let filteredSongs = countryData.songs;
		
			if (filterValue !== "all") {
				filteredSongs = filteredSongs.filter(song => {
					switch(filterType) {
						case "genre":
							return song.genre === filterValue;
						case "artist":
							return song.artist === filterValue;
						case "song":
							return song.title === filterValue;
						default:
							return true;
					}
				});
			}
			
			if (filteredSongs.length > 0) {
				const totalPopularity = filteredSongs.reduce((sum, song) => sum + song.popularity, 0);
				country_to_popularity[country] = totalPopularity / filteredSongs.length;
			} else {
				country_to_popularity[country] = 0;
			}
		});
		
		countries.forEach(country => {
			let countryName = country.properties.name;
			
			// Normalize country names to match data
			if (this.countryNameMapping[countryName]) {
				countryName = this.countryNameMapping[countryName];
			}
			
			country.properties.popularity = country_to_popularity[countryName] || 0;
		});
		
		const popularities = Object.values(country_to_popularity).filter(p => p > 0);
		if (popularities.length > 0) {
			color_scale.domain([d3.min(popularities), d3.max(popularities)]);
		} else {
			color_scale.domain([0, 100]);
		}
		
		this.map_container.selectAll(".country")
			.data(countries)
			.enter()
			.append("path")
			.classed("country", true)
			.attr("d", path_generator)
			.style("fill", d => {
				return d.properties.popularity ? color_scale(d.properties.popularity) : "#ccc";
			})
			.style("stroke", "#fff")
			.style("stroke-width", "0.5px")
			.on("mouseover", (event, d) => {
				// Show tooltip with country name and popularity
				const popularity = d.properties.popularity ? d.properties.popularity.toFixed(1) : "No data";
				d3.select("body").append("div")
					.attr("class", "tooltip")
					.style("position", "absolute")
					.style("background", "white")
					.style("border", "1px solid black")
					.style("padding", "5px")
					.style("border-radius", "5px")
					.style("pointer-events", "none")
					.style("left", (event.pageX + 10) + "px")
					.style("top", (event.pageY - 28) + "px")
					.html(`<strong>${d.properties.name}</strong><br>Popularity: ${popularity}`);
			})
			.on("mouseout", () => {
				d3.select(".tooltip").remove();
			});
		
		this.makeColorbar(this.svg, color_scale, [50, 30], [20, this.svg_height - 2*30], d3.scaleLinear);
		
		let title = "Music Popularity by Country";
		if (filterValue !== "all") {
			switch(filterType) {
				case "genre":
					title = `${filterValue} Genre Popularity by Country`;
					break;
				case "artist":
					title = `${filterValue} Popularity by Country`;
					break;
				case "song":
					title = `"${filterValue}" Popularity by Country`;
					break;
			}
		} else {
			switch(filterType) {
				case "genre":
					title = "All Genres Popularity by Country";
					break;
				case "artist":
					title = "All Artists Popularity by Country";
					break;
				case "song":
					title = "All Songs Popularity by Country";
					break;
			}
		}
		
		
		this.svg.select(".map-title").remove();
		
		this.svg.append("text")
			.attr("class", "map-title")
			.attr("x", this.svg_width / 2)
			.attr("y", this.svg_height * 0.03)
			.attr("text-anchor", "middle")
			.style("font-size", `${Math.max(12, Math.min(this.svg_width * 0.02, 24))}px`)
			.style("font-weight", "bold")
			.text(title);
	}
}

function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		action();
	}
}

whenDocumentLoaded(() => {
	plot_object = new MapPlot('map-plot');
});