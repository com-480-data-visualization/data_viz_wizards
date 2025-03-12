# Project of Data Visualization (COM-480)
## Group Data Viz Wizards

| Student's name | SCIPER |
| -------------- | ------ |
| Levin Hertrich| 387376|
| Yassine Turki| 344704|
| Kirill Zemlianskii | 395871 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

### Dataset

In this project, we analyze global music trends using the [Spotify HUGE database](https://www.kaggle.com/datasets/pepepython/spotify-huge-database-daily-charts-over-3-years) from Kaggle. This dataset contains all the songs in Spotify’s Daily Top 200 charts in 35+1 (global) countries around the world in the years from 2017-2020 . We focus on the `Final Database.csv` file, which contains 151 attributes and 170,633 rows, refining it through Exploratory Data Analysis (EDA). The dataset has 151 columns, which is too much for a meaningful analysis and visualization. Additionally we have to ensure that all columns have the expected datatype and that not too many values are missing, especially in the most important columns. Therefore we perform the following steps:

- Dropping columns: Identifying and removing columns that are not relevant for the analysis and visualization, especially the one-hot encoding of categorial variables
- Date conversion: Converting the release date attribute to datetime
- Check for missing values: Checking for columns with missing values and the percentage of missing values in these columns. Fortunately, in each column there are not more than 50% missing values and the most important columns don’t have any missing values

### Problematic

Music plays an important role in most peoples lives. It motivates, helps in difficult times and makes the best moments even more beautiful. The important role of music is reflected in the Spotify charts, they show what songs are most popular at the moment and which artists are on the rise. But why are certain songs and artists more popular than others? How does this differ between countries and which role does genre play? In this project we want to answer these questions and explore and visualize the data behind the Spotify charts. Therefore we want to explore the following topics:
- Geographical Trends: Identify popular songs and genres
across countries
- Artist Comparison: Analyze artists by genre, popularity, and
followers
- Musical Composition: Examine song attributes like instru-
mentalness, speechiness, and liveliness
- Artist Evolution: Track changes in musical style over time.
- Popularity Trends: Visualize the evolution of music genres
using time series analysis

### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

### Related work
This dataset has previously been explored by several users on the Kaggle platform. However, these analyses primarily focus on basic EDA and present static visualizations. There are some projects on similar music-related data such as [1](https://public.tableau.com/app/profile/anne.bode/viz/SpotifyPREMIUMDashboard/PremiumDashboard), [2](https://medium.com/@shrunalisalian97/spotify-data-visualization-4c878c8114e), and [3](https://www.brandonlu.com/spotify-data-project). These projects serve as a basic inspiration for our ideas, yet they generally remain static or limited in interactive elements. 

We aim to present various music attributes in an entertaining yet insightful manner, significantly enhancing user engagement and data comprehension. We draw inspiration from several visualizations outside the music domain. For instance, the interactive world map provided by Google Trends demonstrates an effective way of presenting geographically linked information. We plan to adopt this method to visualize music interests across different regions. The visualization from Our World in Data, showcases stacked histograms which we plan to adapt to demonstrate evolving trends in music attributes over time.

## Milestone 2 (18th April, 5pm)

**10% of the final grade**


## Milestone 3 (30th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
