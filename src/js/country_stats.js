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
            .attr("value", "Global")
            .text("Global");
            
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

    showCountryStatistics(countryName) {
        d3.select("#map-plot").style("display", "none");
        d3.select("#filter-controls").style("display", "none");
        
        d3.select("#country-title").text("");
        d3.select("#popular-artists").html("");
        d3.select("#popular-songs").html("");
        d3.select("#popular-genres").html("");
        d3.select("#characteristics-chart").html("");
        
        if (!countryName) {
            d3.select("#country-selector").property("value", "Global");
        }
        
        this.show();
        
        if (countryName) {
            d3.select("#country-selector").property("value", countryName);
            this.updateStatistics();
        } else {
            d3.select("#country-selector").property("value", "Global");
            this.updateStatistics();
        }
    }

    updateStatistics() {
        const countryName = d3.select("#country-selector").property("value");
        
        if (countryName === "Global") {
            this.showGlobalStatistics();
            return;
        }
        
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

    showGlobalStatistics() {
        d3.select("#country-title").text("Global Music Statistics");
        
        const artistPopularity = {};
        const songPopularity = {};
        const genrePopularity = {};
        let totalSongs = 0;
        
        Object.values(this.data_by_country).forEach(country => {
            country.songs.forEach(song => {
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
                
                totalSongs++;
            });
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
        
        d3.select("#characteristics-chart").html("");
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
            happiness: 0,
            energy: 0,
            danceability: 0,
            speechiness: 0,
            acoustics: 0,
            instrumentalness: 0,
            valence: 0,
            tempo: 0
        };
        
        songs.forEach(song => {
            characteristics.happiness += song.happiness || 0;
            characteristics.energy += song.energy || 0;
            characteristics.danceability += song.danceability || 0;
            characteristics.speechiness += song.speechiness || 0;
            characteristics.acoustics += song.acoustics || 0;
            characteristics.instrumentalness += song.instrumentalness || 0;
            characteristics.valence += song.valence || 0;
            characteristics.tempo += song.tempo || 0;
        });
        
        Object.keys(characteristics).forEach(key => {
            characteristics[key] /= songs.length;
        });
        
        return characteristics;
    }

    calculateGlobalCharacteristics() {
        const characteristics = {
            happiness: 0,
            energy: 0,
            danceability: 0,
            speechiness: 0,
            acoustics: 0,
            instrumentalness: 0,
            valence: 0,
            tempo: 0
        };
        
        let totalSongs = 0;
        
        Object.values(this.data_by_country).forEach(country => {
            country.songs.forEach(song => {
                characteristics.happiness += song.happiness || 0;
                characteristics.energy += song.energy || 0;
                characteristics.danceability += song.danceability || 0;
                characteristics.speechiness += song.speechiness || 0;
                characteristics.acoustics += song.acoustics || 0;
                characteristics.instrumentalness += song.instrumentalness || 0;
                characteristics.valence += song.valence || 0;
                characteristics.tempo += song.tempo || 0;
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
        
        const margin = {top: 20, right: 30, bottom: 60, left: 60};
        const width = chartContainer.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 300;
        
        const svg = chartContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const data = [];
        Object.keys(countryCharacteristics).forEach(key => {
            const countryValue = countryCharacteristics[key] || 0;
            const globalValue = globalCharacteristics[key] || 0;
            
            let difference = 0;
            if (globalValue !== 0) {
                difference = ((countryValue - globalValue) / globalValue) * 100;
            }
            
            if (!isFinite(difference)) {
                difference = 0;
            }
            
            // Apply scale factor only to tempo as it's typically much higher than other values
            const scaleFactor = key === 'tempo' ? 0.01 : 1;
            
            data.push({
                characteristic: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
                country: countryValue * scaleFactor,
                global: globalValue * scaleFactor,
                difference: difference
            });
        });
        
        const x = d3.scaleBand()
            .domain(data.map(d => d.characteristic))
            .range([0, width])
            .padding(0.3);
        
        const minDiff = d3.min(data, d => d.difference) || -20;
        const maxDiff = d3.max(data, d => d.difference) || 20;
        
        const y = d3.scaleLinear()
            .domain([Math.min(minDiff, -20), Math.max(maxDiff, 20)])
            .range([height, 0]);
        
        // X axis
        svg.append("g")
            .attr("transform", `translate(0,${y(0)})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");
        
        // Y axis
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${d}%`));
        
        // Y axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Difference from Global Average (%)");
        
        // X axis label
        svg.append("text")
            .attr("transform", `translate(${width/2}, ${height + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .text("Music Characteristics");
        
        // Zero line
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", y(0))
            .attr("x2", width)
            .attr("y2", y(0))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4");
        
        // Bars
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.characteristic))
            .attr("width", x.bandwidth())
            .attr("y", d => d.difference > 0 ? y(d.difference) : y(0))
            .attr("height", d => Math.abs(y(d.difference) - y(0)))
            .attr("fill", d => d.difference > 0 ? "#4CAF50" : "#F44336")
            .append("title")
            .text(d => `${d.characteristic}: ${d.difference.toFixed(1)}% difference from global average`);
        
        // Value labels
        svg.selectAll(".label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.characteristic) + x.bandwidth() / 2)
            .attr("y", d => d.difference > 0 ? y(d.difference) - 5 : y(d.difference) + 15)
            .attr("text-anchor", "middle")
            .text(d => `${d.difference.toFixed(1)}%`);
            
        // Add tooltip for more information
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
            
        svg.selectAll(".bar")
            .data(data)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.characteristic}</strong><br/>
                              Country: ${d.country.toFixed(2)}<br/>
                              Global: ${d.global.toFixed(2)}<br/>
                              Difference: ${d.difference.toFixed(1)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }
}

export default CountryStatistics;