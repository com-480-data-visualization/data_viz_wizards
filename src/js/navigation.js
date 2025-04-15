export default class Navigation {
    constructor(parentContainer, mapPlot) {
        this.mapPlot = mapPlot;
        this.createNavigationBar(parentContainer);
    }

    createNavigationBar(parentContainer) {
        const navBar = parentContainer.insert("div", ":first-child")
            .attr("id", "navigation-bar")
            .style("background-color", "#333")
            .style("overflow", "hidden")
            .style("margin-bottom", "10px")
            .style("width", "100%")
            .style("position", "sticky")
            .style("top", "0")
            .style("z-index", "1000");
            
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
                this.mapPlot.showWorldMap();
            });
            
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
                this.mapPlot.showCountryStatistics();
            });
            
        navBar.append("a")
            .attr("href", "#")
            .style("float", "left")
            .style("display", "block")
            .style("color", "white")
            .style("text-align", "center")
            .style("padding", "14px 16px")
            .style("text-decoration", "none")
            .text("Artist Comparison")
            .on("click", (event) => {
                event.preventDefault();
                this.mapPlot.showArtistComparison();
            });
    }
}