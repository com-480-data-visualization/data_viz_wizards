class CountryStatistics {
    constructor(parentContainer, data_by_country) {
        this.data_by_country = data_by_country;
        this.container = this.createContainer(parentContainer);
        this.setupUI();
    }

    createContainer(parentContainer) {
        let statsContainer = d3.select("#country-stats-container");
        
        if (statsContainer.empty()) {
            statsContainer = parentContainer.append("div")
                .attr("id", "country-stats-container")
                .style("width", "100%")
                .style("margin", "0 auto")
                .style("display", "none");
        }
        
        return statsContainer;
    }

    setupUI() {
        const selectorDiv = this.container.append("div")
            .style("margin", "20px 0");
            
        selectorDiv.append("label")
            .attr("for", "country-selector")
            .text("Select a country: ");
            
        const countrySelector = selectorDiv.append("select")
            .attr("id", "country-selector")
            .style("width", "200px")
            .on("change", () => this.updateStatistics());
            
        countrySelector.append("option")
            .attr("value", "")
            .text("-- Select a country --");
            
        const countryNames = Object.keys(this.data_by_country).sort();
        
        countrySelector.selectAll("option.country")
            .data(countryNames)
            .enter()
            .append("option")
            .attr("class", "country")
            .attr("value", d => d)
            .text(d => d);
            
        this.container.append("div")
            .attr("id", "country-title")
            .style("text-align", "center")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .style("margin", "20px 0");
            
        const popularContent = this.container.append("div")
            .attr("id", "popular-content")
            .style("display", "flex")
            .style("justify-content", "space-around")
            .style("margin", "20px 0");
            
        popularContent.append("div")
            .attr("id", "popular-artists")
            .style("width", "30%");
            
        popularContent.append("div")
            .attr("id", "popular-songs")
            .style("width", "30%");
            
        popularContent.append("div")
            .attr("id", "popular-genres")
            .style("width", "30%");
            
        this.container.append("div")
            .attr("id", "characteristics-chart")
            .style("width", "80%")
            .style("height", "400px")
            .style("margin", "40px auto");
    }

    show() {
        this.container.style("display", "block");
    }

    hide() {
        this.container.style("display", "none");
    }

    showCountryStatistics() {
		d3.select("#map-plot").style("display", "none");
		d3.select("#filter-controls").style("display", "none");
		
		let statsContainer = d3.select("#country-stats-container");
		
		if (statsContainer.empty()) {
			statsContainer = d3.select("body").append("div")
				.attr("id", "country-stats-container")
				.style("width", "100%")
				.style("margin", "0 auto");
				
			const selectorDiv = statsContainer.append("div")
				.style("margin", "20px 0");
				
			selectorDiv.append("label")
				.attr("for", "country-selector")
				.text("Select a country: ");
				
			const countrySelector = selectorDiv.append("select")
				.attr("id", "country-selector")
				.style("width", "200px")
				.on("change", () => this.updateCountryStatistics());
				
			countrySelector.append("option")
				.attr("value", "")
				.text("-- Select a country --");
				
			const countryNames = Object.keys(this.data_by_country).sort();
			
			countrySelector.selectAll("option.country")
				.data(countryNames)
				.enter()
				.append("option")
				.attr("class", "country")
				.attr("value", d => d)
				.text(d => d);
				
			statsContainer.append("div")
				.attr("id", "country-title")
				.style("text-align", "center")
				.style("font-size", "24px")
				.style("font-weight", "bold")
				.style("margin", "20px 0");
				
			statsContainer.append("div")
				.attr("id", "popular-content")
				.style("display", "flex")
				.style("justify-content", "space-around")
				.style("margin", "20px 0");
				
			const popularContent = d3.select("#popular-content");
			
			popularContent.append("div")
				.attr("id", "popular-artists")
				.style("width", "30%");
				
			popularContent.append("div")
				.attr("id", "popular-songs")
				.style("width", "30%");
				
			popularContent.append("div")
				.attr("id", "popular-genres")
				.style("width", "30%");
				
			statsContainer.append("div")
				.attr("id", "characteristics-chart")
				.style("width", "80%")
				.style("height", "400px")
				.style("margin", "40px auto");
		} else {
			statsContainer.style("display", "block");
		}
	}

    updateCountryStatistics() {
		const countryName = d3.select("#country-selector").property("value");
		
		if (!countryName) return;
		
		const countryData = this.data_by_country[countryName];
		
		if (!countryData) {
			console.error("No data found for country:", countryName);
			return;
		}
		
		d3.select("#country-title").text(`Music Statistics for ${countryName}`);
		
		const artistPopularity = {};
		const songPopularity = {};
		const genrePopularity = {};
		
		countryData.songs.forEach(song => {
			if (!artistPopularity[song.artist]) {
				artistPopularity[song.artist] = {
					popularity: 0,
					count: 0
				};
			}
			artistPopularity[song.artist].popularity += song.popularity;
			artistPopularity[song.artist].count++;
			
			songPopularity[song.title] = song.popularity;
			
			if (!genrePopularity[song.genre]) {
				genrePopularity[song.genre] = {
					popularity: 0,
					count: 0
				};
			}
			genrePopularity[song.genre].popularity += song.popularity;
			genrePopularity[song.genre].count++;
		});
		
		Object.keys(artistPopularity).forEach(artist => {
			artistPopularity[artist] = artistPopularity[artist].popularity / artistPopularity[artist].count;
		});
		
		Object.keys(genrePopularity).forEach(genre => {
			genrePopularity[genre] = genrePopularity[genre].popularity / genrePopularity[genre].count;
		});
		
		const topArtists = Object.entries(artistPopularity)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
			
		const topSongs = Object.entries(songPopularity)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
			
		const topGenres = Object.entries(genrePopularity)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
		
		this.updateTopList("#popular-artists", "Top Artists", topArtists);
		this.updateTopList("#popular-songs", "Top Songs", topSongs);
		this.updateTopList("#popular-genres", "Top Genres", topGenres);
		
		const countryCharacteristics = this.calculateCountryCharacteristics(countryData.songs);
		
		const globalCharacteristics = this.calculateGlobalCharacteristics();
		
		this.createCharacteristicsChart(countryCharacteristics, globalCharacteristics);
	}

    updateTopList(selector, title, items) {
		const container = d3.select(selector);
		container.html(""); 
		
		container.append("h3")
			.text(title)
			.style("text-align", "center");
			
		const list = container.append("ol")
			.style("padding-left", "20px");
			
		list.selectAll("li")
			.data(items)
			.enter()
			.append("li")
			.html(d => `${d[0]} <span style="float:right;color:#666;">${d[1].toFixed(1)}</span>`);
	}

	calculateCountryCharacteristics(songs) {
		const characteristics = {
			danceability: 0,
			energy: 0,
			valence: 0,
			tempo: 0
		};
		
		songs.forEach(song => {
			characteristics.danceability += song.danceability;
			characteristics.energy += song.energy;
			characteristics.valence += song.valence;
			characteristics.tempo += song.tempo;
		});
		
		Object.keys(characteristics).forEach(key => {
			characteristics[key] /= songs.length;
		});
		
		return characteristics;
	}

    calculateGlobalCharacteristics() {
		const characteristics = {
			danceability: 0,
			energy: 0,
			valence: 0,
			tempo: 0
		};
		
		let totalSongs = 0;
		
		Object.values(this.data_by_country).forEach(country => {
			country.songs.forEach(song => {
				characteristics.danceability += song.danceability;
				characteristics.energy += song.energy;
				characteristics.valence += song.valence;
				characteristics.tempo += song.tempo;
				totalSongs++;
			});
		});
		
		Object.keys(characteristics).forEach(key => {
			characteristics[key] /= totalSongs;
		});
		
		return characteristics;
	}

	createCharacteristicsChart(countryCharacteristics, globalCharacteristics) {
		const chartContainer = d3.select("#characteristics-chart");
		chartContainer.html("");
		
		chartContainer.append("h3")
			.text("Music Characteristics Comparison")
			.style("text-align", "center");
		
		const margin = {top: 20, right: 30, bottom: 40, left: 60};
		const width = chartContainer.node().getBoundingClientRect().width - margin.left - margin.right;
		const height = 300;
		
		const svg = chartContainer.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);
		
		const data = [];
		Object.keys(countryCharacteristics).forEach(key => {
			const countryValue = countryCharacteristics[key];
			const globalValue = globalCharacteristics[key];
			
			const scaleFactor = key === 'tempo' ? 0.01 : 1;
			
			data.push({
				characteristic: key,
				country: countryValue * scaleFactor,
				global: globalValue * scaleFactor,
				difference: ((countryValue - globalValue) / globalValue) * 100
			});
		});
		
		const x = d3.scaleBand()
			.domain(data.map(d => d.characteristic))
			.range([0, width])
			.padding(0.3);
		
		const y = d3.scaleLinear()
			.domain([d3.min(data, d => Math.min(d.difference, -20)), d3.max(data, d => Math.max(d.difference, 20))])
			.range([height, 0]);
		
		svg.append("g")
			.attr("transform", `translate(0,${height/2})`)
			.call(d3.axisBottom(x))
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", "rotate(-45)");
		
		svg.append("g")
			.call(d3.axisLeft(y).tickFormat(d => `${d}%`));
		
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Difference from Global Average (%)");
		
		svg.append("line")
			.attr("x1", 0)
			.attr("y1", y(0))
			.attr("x2", width)
			.attr("y2", y(0))
			.attr("stroke", "black")
			.attr("stroke-width", 1)
			.attr("stroke-dasharray", "4");
		
		svg.selectAll(".bar")
			.data(data)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", d => x(d.characteristic))
			.attr("width", x.bandwidth())
			.attr("y", d => d.difference > 0 ? y(d.difference) : y(0))
			.attr("height", d => Math.abs(y(d.difference) - y(0)))
			.attr("fill", d => d.difference > 0 ? "#4CAF50" : "#F44336");
		
		svg.selectAll(".label")
			.data(data)
			.enter()
			.append("text")
			.attr("class", "label")
			.attr("x", d => x(d.characteristic) + x.bandwidth() / 2)
			.attr("y", d => d.difference > 0 ? y(d.difference) - 5 : y(d.difference) + 15)
			.attr("text-anchor", "middle")
			.text(d => `${d.difference.toFixed(1)}%`);
	}

}

export default CountryStatistics;