class ArtistComparison {
    constructor(parentContainer, musicData) {
        this.musicData = musicData;
        this.container = this.createContainer(parentContainer);
        this.selectedArtists = [];
        this.artistData = {};
        this.processArtistData();
        this.setupUI();
    }

    createContainer(parentContainer) {
        let comparisonContainer = d3.select("#artist-comparison-container");
        
        if (comparisonContainer.empty()) {
            comparisonContainer = parentContainer.append("div")
                .attr("id", "artist-comparison-container")
                .style("width", "100%")
                .style("margin", "0 auto")
                .style("display", "none");
        }
        
        return comparisonContainer;
    }

    processArtistData() {
        const artistGroups = d3.group(this.musicData, d => d.Artist);
        
        artistGroups.forEach((songs, artist) => {
            const numSongs = songs.length;
            const uniqueAlbums = new Set(songs.map(s => s.Album || "Unknown")).size;
            const avgPopularity = d3.mean(songs, s => parseFloat(s.Popularity));
            const top50Songs = songs.filter(s => parseFloat(s.Popularity) >= 80).length;
            const explicitSongs = songs.filter(s => s.Explicit === "TRUE").length;
            const explicitRatio = explicitSongs / numSongs;
            
            const avgHappiness = d3.mean(songs, s => parseFloat(s.Happiness));
            const avgDanceability = d3.mean(songs, s => parseFloat(s.danceability));
            const avgEnergy = d3.mean(songs, s => parseFloat(s.energy));
            const avgSpeechiness = d3.mean(songs, s => parseFloat(s.speechiness));
            const avgAcousticness = d3.mean(songs, s => parseFloat(s.acousticness));
            const avgInstrumentalness = d3.mean(songs, s => parseFloat(s.instrumentalness));
            const avgValence = d3.mean(songs, s => parseFloat(s.valence));
            const avgTempo = d3.mean(songs, s => parseFloat(s.tempo));
            
            this.artistData[artist] = {
                name: artist,
                overallStats: {
                    popularity: avgPopularity,
                    numSongs: numSongs,
                    numAlbums: uniqueAlbums,
                    top50Songs: top50Songs,
                    explicitRatio: explicitRatio
                },
                musicalCharacteristics: {
                    happiness: avgHappiness,
                    danceability: avgDanceability,
                    energy: avgEnergy,
                    speechiness: avgSpeechiness,
                    acousticness: avgAcousticness,
                    instrumentalness: avgInstrumentalness,
                    valence: avgValence,
                    tempo: avgTempo
                }
            };
        });
    }

    setupUI() {
        this.container.html("");
        
        this.container.append("h2")
            .text("Artist Comparison")
            .style("text-align", "center")
            .style("margin-bottom", "30px");
        
        const selectionArea = this.container.append("div")
            .attr("class", "selection-area")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("margin-bottom", "30px");
        
        const artistSelector = selectionArea.append("select")
            .attr("id", "artist-selector")
            .style("width", "250px")
            .style("margin-right", "10px");
        
        artistSelector.append("option")
            .attr("value", "")
            .text("-- Select an artist --");
        
        const artistNames = Object.keys(this.artistData).sort();
        
        artistSelector.selectAll("option.artist")
            .data(artistNames)
            .enter()
            .append("option")
            .attr("class", "artist")
            .attr("value", d => d)
            .text(d => d);
        
        selectionArea.append("button")
            .text("Add Artist")
            .on("click", () => {
                const selectedArtist = d3.select("#artist-selector").property("value");
                if (selectedArtist && !this.selectedArtists.includes(selectedArtist)) {
                    this.selectedArtists.push(selectedArtist);
                    this.updateComparison();
                }
            });
        
        this.container.append("div")
            .attr("id", "selected-artists-list")
            .style("margin-bottom", "20px");
        
        this.container.append("div")
            .attr("id", "overall-stats-chart")
            .style("width", "100%")
            .style("height", "500px")
            .style("margin-bottom", "40px");
        
        this.container.append("div")
            .attr("id", "musical-characteristics-chart")
            .style("width", "100%")
            .style("height", "500px");
    }

    updateComparison() {
        this.updateSelectedArtistsList();
        
        if (this.selectedArtists.length > 0) {
            this.createOverallStatsChart();
            this.createMusicalCharacteristicsChart();
        } else {
            d3.select("#overall-stats-chart").html("");
            d3.select("#musical-characteristics-chart").html("");
        }
    }

    updateSelectedArtistsList() {
        const listContainer = d3.select("#selected-artists-list");
        listContainer.html("");
        
        if (this.selectedArtists.length === 0) {
            listContainer.append("p")
                .text("No artists selected. Please select at least one artist to compare.")
                .style("text-align", "center");
            return;
        }
        
        const list = listContainer.append("ul")
            .style("list-style", "none")
            .style("display", "flex")
            .style("flex-wrap", "wrap")
            .style("justify-content", "center")
            .style("padding", "0");
        
        const self = this;
        
        list.selectAll("li")
            .data(this.selectedArtists)
            .enter()
            .append("li")
            .style("margin", "5px 10px")
            .style("padding", "5px 10px")
            .style("background-color", (d, i) => d3.schemeCategory10[i % 10])
            .style("color", "white")
            .style("border-radius", "15px")
            .style("display", "flex")
            .style("align-items", "center")
            .each(function(d) {
                d3.select(this).append("span")
                    .text(d);
                
                d3.select(this).append("span")
                    .text("✕")
                    .style("margin-left", "10px")
                    .style("cursor", "pointer")
                    .on("click", function(event, d) {
                        event.stopPropagation();
                        const index = self.selectedArtists.indexOf(d);
                        if (index > -1) {
                            self.selectedArtists.splice(index, 1);
                            self.updateComparison();
                        }
                    });
            });
    }

    createOverallStatsChart() {
        const chartContainer = d3.select("#overall-stats-chart");
        chartContainer.html("");
        
        chartContainer.append("h3")
            .text("Overall Statistics Comparison")
            .style("text-align", "center");
        
        const margin = {top: 100, right: 100, bottom: 100, left: 100};
        const width = chartContainer.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        const svg = chartContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const features = ["popularity", "numSongs", "numAlbums", "top50Songs", "explicitRatio"];
        const featureLabels = ["Popularity", "Number of Songs", "Number of Albums", "Top 50 Songs", "Explicit Ratio"];
        
        const maxValues = {};
        features.forEach(feature => {
            maxValues[feature] = d3.max(this.selectedArtists, artist => {
                const value = this.artistData[artist].overallStats[feature];
                return isNaN(value) ? 0 : value;
            }) || 1;
        });
        
        const radialScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, height / 2]);
        
        const angleSlice = Math.PI * 2 / features.length;
        
        const gridLines = svg.append("g").attr("class", "grid-lines");
        
        const levels = 5;
        for (let j = 0; j < levels; j++) {
            const levelFactor = (j + 1) / levels;
            
            gridLines.selectAll(".level-line")
                .data(features)
                .enter()
                .append("line")
                .attr("class", "level-line")
                .attr("x1", (d, i) => radialScale(levelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y1", (d, i) => radialScale(levelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
                .attr("x2", (d, i) => radialScale(levelFactor) * Math.cos(angleSlice * ((i + 1) % features.length) - Math.PI / 2))
                .attr("y2", (d, i) => radialScale(levelFactor) * Math.sin(angleSlice * ((i + 1) % features.length) - Math.PI / 2))
                .attr("transform", `translate(${width / 2}, ${height / 2})`)
                .style("stroke", "lightgray")
                .style("stroke-width", "1px");
        }
        
        const axes = svg.append("g").attr("class", "axes");
        
        axes.selectAll(".axis")
            .data(features)
            .enter()
            .append("line")
            .attr("class", "axis")
            .attr("x1", width / 2)
            .attr("y1", height / 2)
            .attr("x2", (d, i) => width / 2 + radialScale(1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => height / 2 + radialScale(1) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("stroke", "gray")
            .style("stroke-width", "1px");
        
        const labels = svg.append("g").attr("class", "labels");
        
        labels.selectAll(".label")
            .data(featureLabels)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", (d, i) => width / 2 + (radialScale(1) + 20) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => height / 2 + (radialScale(1) + 20) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("text-anchor", (d, i) => {
                const angle = angleSlice * i;
                if (angle === 0 || angle === Math.PI) return "middle";
                return angle < Math.PI ? "start" : "end";
            })
            .attr("dominant-baseline", (d, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                if (angle === Math.PI / 2 || angle === -Math.PI / 2) return "middle";
                return angle < 0 || angle > Math.PI ? "hanging" : "auto";
            })
            .text(d => d);
        
        const radarLine = d3.lineRadial()
            .radius(d => d.value)
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);
        
        const radarAreas = svg.append("g").attr("class", "radar-areas");
        
        this.selectedArtists.forEach((artist, i) => {
            const color = d3.schemeCategory10[i % 10];
            const artistStats = this.artistData[artist].overallStats;
            
            const radarData = features.map(feature => {
                const rawValue = artistStats[feature];
                const value = !isNaN(rawValue) && maxValues[feature] !== 0 ? 
                    rawValue / maxValues[feature] : 0;
                
                return {
                    feature: feature,
                    value: radialScale(value)
                };
            });
            
            radarAreas.append("path")
                .datum(radarData)
                .attr("class", "radar-area")
                .attr("d", radarLine)
                .attr("transform", `translate(${width / 2}, ${height / 2})`)
                .style("fill", color)
                .style("fill-opacity", 0.3)
                .style("stroke", color)
                .style("stroke-width", "2px");
            
            radarAreas.selectAll(`.radar-point-${i}`)
                .data(radarData)
                .enter()
                .append("circle")
                .attr("class", `radar-point-${i}`)
                .attr("cx", (d, j) => {
                    const val = width / 2 + d.value * Math.cos(angleSlice * j - Math.PI / 2);
                    return isNaN(val) ? 0 : val;
                })
                .attr("cy", (d, j) => {
                    const val = height / 2 + d.value * Math.sin(angleSlice * j - Math.PI / 2);
                    return isNaN(val) ? 0 : val;
                })
                .attr("r", 4)
                .style("fill", color);
        });
        
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 100}, ${-margin.top / 2})`);
        
        this.selectedArtists.forEach((artist, i) => {
            const color = d3.schemeCategory10[i % 10];
            
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .style("fill", color);
            
            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 12)
                .text(artist)
                .style("font-size", "12px");
        });
    }

    createMusicalCharacteristicsChart() {
        const chartContainer = d3.select("#musical-characteristics-chart");
        chartContainer.html("");
        
        chartContainer.append("h3")
            .text("Musical Characteristics Comparison")
            .style("text-align", "center");
        
        const margin = {top: 100, right: 100, bottom: 100, left: 100};
        const width = chartContainer.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        const svg = chartContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const features = ["danceability", "energy", "speechiness", "acousticness", "instrumentalness", "valence", "tempo"];
        const featureLabels = ["Danceability", "Energy", "Speechiness", "Acousticness", "Instrumentalness", "Happiness", "Tempo"];
        
        const maxValues = {};
        features.forEach(feature => {
            if (feature === "tempo") {
                const tempos = this.selectedArtists.map(artist => {
                    const value = this.artistData[artist].musicalCharacteristics[feature];
                    return isNaN(value) ? 0 : value;
                });
                const maxTempo = d3.max(tempos) || 200;
                maxValues[feature] = maxTempo > 0 ? maxTempo : 200;
            } else {
                maxValues[feature] = 1;
            }
        });
        
        const radialScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, height / 2]);
        
        const angleSlice = Math.PI * 2 / features.length;
        
        const gridLines = svg.append("g").attr("class", "grid-lines");
        
        const levels = 5;
        for (let j = 0; j < levels; j++) {
            const levelFactor = (j + 1) / levels;
            
            gridLines.selectAll(".level-line")
                .data(features)
                .enter()
                .append("line")
                .attr("class", "level-line")
                .attr("x1", (d, i) => radialScale(levelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y1", (d, i) => radialScale(levelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
                .attr("x2", (d, i) => radialScale(levelFactor) * Math.cos(angleSlice * ((i + 1) % features.length) - Math.PI / 2))
                .attr("y2", (d, i) => radialScale(levelFactor) * Math.sin(angleSlice * ((i + 1) % features.length) - Math.PI / 2))
                .attr("transform", `translate(${width / 2}, ${height / 2})`)
                .style("stroke", "lightgray")
                .style("stroke-width", "1px");
        }
        
        const axes = svg.append("g").attr("class", "axes");
        
        axes.selectAll(".axis")
            .data(features)
            .enter()
            .append("line")
            .attr("class", "axis")
            .attr("x1", width / 2)
            .attr("y1", height / 2)
            .attr("x2", (d, i) => width / 2 + radialScale(1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => height / 2 + radialScale(1) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("stroke", "gray")
            .style("stroke-width", "1px");
        
        const labels = svg.append("g").attr("class", "labels");
        
        labels.selectAll(".label")
            .data(featureLabels)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", (d, i) => width / 2 + (radialScale(1) + 20) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => height / 2 + (radialScale(1) + 20) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("text-anchor", (d, i) => {
                const angle = angleSlice * i;
                if (angle === 0 || angle === Math.PI) return "middle";
                return angle < Math.PI ? "start" : "end";
            })
            .attr("dominant-baseline", (d, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                if (angle === Math.PI / 2 || angle === -Math.PI / 2) return "middle";
                return angle < 0 || angle > Math.PI ? "hanging" : "auto";
            })
            .text(d => d);
        
        const radarLine = d3.lineRadial()
            .radius(d => d.value)
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);
        
        const radarAreas = svg.append("g").attr("class", "radar-areas");
        
        this.selectedArtists.forEach((artist, i) => {
            const color = d3.schemeCategory10[i % 10];
            const artistCharacteristics = this.artistData[artist].musicalCharacteristics;
            
            const radarData = features.map(feature => {
                let rawValue = artistCharacteristics[feature];
                let value;
                
                if (feature === "tempo") {
                    value = !isNaN(rawValue) && maxValues[feature] > 0 ? 
                        rawValue / maxValues[feature] : 0;
                } else {
                    value = !isNaN(rawValue) ? rawValue : 0;
                }
                
                return {
                    feature: feature,
                    value: radialScale(value)
                };
            });
            
            radarAreas.append("path")
                .datum(radarData)
                .attr("class", "radar-area")
                .attr("d", radarLine)
                .attr("transform", `translate(${width / 2}, ${height / 2})`)
                .style("fill", color)
                .style("fill-opacity", 0.3)
                .style("stroke", color)
                .style("stroke-width", "2px");
            
            radarAreas.selectAll(`.radar-point-${i}`)
                .data(radarData)
                .enter()
                .append("circle")
                .attr("class", `radar-point-${i}`)
                .attr("cx", (d, j) => {
                    const val = width / 2 + d.value * Math.cos(angleSlice * j - Math.PI / 2);
                    return isNaN(val) ? 0 : val;
                })
                .attr("cy", (d, j) => {
                    const val = height / 2 + d.value * Math.sin(angleSlice * j - Math.PI / 2);
                    return isNaN(val) ? 0 : val;
                })
                .attr("r", 4)
                .style("fill", color);
        });
        
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 100}, ${-margin.top / 2})`);
        
        this.selectedArtists.forEach((artist, i) => {
            const color = d3.schemeCategory10[i % 10];
            
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .style("fill", color);
            
            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 12)
                .text(artist)
                .style("font-size", "12px");
        });
    }

    show() {
        this.container.style("display", "block");
    }

    hide() {
        this.container.style("display", "none");
    }
}

export default ArtistComparison;
