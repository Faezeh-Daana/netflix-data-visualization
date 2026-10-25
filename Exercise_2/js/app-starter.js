// STARTER FILE: Netflix movies by genre
// Goal: count how many movies Netflix lists in each genre,
// keep the 10 biggest genres, and draw them as a coloured bar chart.
//
// Data: data/NetflixMovies_added.csv, one row per movie, from Netflix's
// "What We Watched" report (January to June 2025), matched to IMDb genres.
//
// When this file first runs you should see an EMPTY gray-bordered box,
// and two arrays in the console: the raw rows and the movies (still text).
// Do CLEAN 1 to CLEAN 4 first, then STEP 1 to STEP 5 build the chart.

async function main() {
  const app = d3.select('#app')

  // ---- PRE-FILLED: load the data --------------------------------------
  // The ../ goes up one folder, from starter-files to 06_netflix-added.
  const raw = await d3.csv('./data/NetflixMovies_added.csv')
  console.log('raw rows', raw)
  const rawTV = await d3.csv('./data/NetflixTV_added.csv')

  console.log('TV column names:', rawTV.columns)

console.table(
  rawTV.filter(d => d.Title?.includes('Squid Game'))
    .map(d => ({
      Title: d.Title,
      Views: d.Views,
      premiered: d.premiered,
      ReleaseDate: d['Release Date']
    }))
)
  console.log('TV rows', rawTV)
  console.log('Movie sample:', raw[0])
  console.log('TV sample:', rawTV[0])

  // ---- CLEANING THE DATA -----------------------------------------------
  // Real data never arrives ready to chart. You'll fix it in four steps,
  // CLEAN 1 to CLEAN 4. Check the console after each one.
  //
  // .map() runs once per raw row and builds a NEW, tidier object for it:
  // we keep only the columns we need and give them simple names.
  // Right now every value is still TEXT, exactly as it was in the CSV.
  const movies = raw.map((d) => ({
    title: d.Title,
    release_year: +d.startYear,
    views: +d.Views, //                 CLEAN 1: put + in front of d.Views
    hours_viewed: +d['Hours Viewed'], // CLEAN 1: and in front of this one
    runtime_minutes: toMinutes(d.Runtime), //     CLEAN 2: wrap it: toMinutes(d.Runtime)
    release_date: d['Release Date'],
    genres: parseGenres(d.genres), //               CLEAN 3: wrap it: parseGenres(d.genres)
  }))
  console.log('clean movies', movies)
  const tvShows = rawTV.map((d) => ({
  title: d.Title,
  release_year: +d.premiered?.slice(0, 4),
  views: +d.Views,
  type: 'TV Show'
}))

console.log('clean TV shows', tvShows)
const allTitles = [
  ...movies.map((d) => ({ ...d, type: 'Movie' })),
  ...tvShows
]

console.log('all titles', allTitles)

// Keep only titles with valid release years and view counts for accurate analysis.
const cleanTitles = allTitles.filter((d) =>
  Number.isInteger(d.release_year) &&
  d.release_year >= 1900 &&
  d.release_year <= 2025 &&
  Number.isFinite(d.views) &&
  d.views >= 0
)

console.log('clean titles', cleanTitles)

// Find the records excluded during cleaning.
const removedTitles = allTitles.filter((d) =>
  !(
    Number.isInteger(d.release_year) &&
    d.release_year >= 1900 &&
    d.release_year <= 2025 &&
    Number.isFinite(d.views) &&
    d.views >= 0
  )
)

console.table(removedTitles)

// Group titles into release periods to compare older and newer content.
const titlesByPeriod = cleanTitles.map((d) => ({
  ...d,
  period:
    d.release_year < 1990 ? 'Before 1990' :
    d.release_year < 2000 ? '1990s' :
    d.release_year < 2010 ? '2000s' :
    d.release_year < 2020 ? '2010s' :
    '2020–2025'
}))

console.log('titles by period', titlesByPeriod)

// Calculate average views and number of titles for each release period.
const viewsByPeriod = d3.rollup(
  titlesByPeriod,
  (group) => ({
    averageViews: d3.mean(group, (d) => d.views),
    count: group.length
  }),
  (d) => d.period
)

console.log('views by period', viewsByPeriod)

// Convert grouped results into an ordered array for the bar chart.
const periodData = Array.from(viewsByPeriod, ([period, values]) => ({
  period: period,
  averageViews: values.averageViews,
  count: values.count
}))

const periodOrder = [
  'Before 1990',
  '1990s',
  '2000s',
  '2010s',
  '2020–2025'
]

periodData.sort((a, b) =>
  periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period)
)

console.table(periodData)

// Calculate average views by release period separately for movies and TV shows.
const viewsByType = d3.rollup(
  titlesByPeriod,
  group => ({
    averageViews: d3.mean(group, d => d.views),
    count: group.length
  }),
  d => d.type,
  d => d.period
)

console.log('views by type', viewsByType)

// Prepare movie and TV data in the same order as the main chart.
const movieData = periodOrder.map(period => ({
  period: period,
  averageViews: viewsByType.get('Movie')?.get(period)?.averageViews ?? 0,
  count: viewsByType.get('Movie')?.get(period)?.count ?? 0
}))

const tvData = periodOrder.map(period => ({
  period: period,
  averageViews: viewsByType.get('TV Show')?.get(period)?.averageViews ?? 0,
  count: viewsByType.get('TV Show')?.get(period)?.count ?? 0
}))



// Create the SVG canvas for our release-period visualization.
const svg = d3.create('svg')
  .attr('viewBox', [0, 0, 800, 450])

  // Set up scales for release periods and average views.
const xScale = d3.scaleBand()
  .domain(periodOrder)
  .range([100, 750])
  .padding(0.25)

  // Position movie and TV bars side by side within each release period.
const xSubScale = d3.scaleBand()
  .domain(['Movie', 'TV Show'])
  .range([0, xScale.bandwidth()])
  .padding(0.12)

  // Combine movie and TV data for the grouped bar chart.
const groupedData = [
  ...movieData.map(d => ({ ...d, type: 'Movie' })),
  ...tvData.map(d => ({ ...d, type: 'TV Show' }))
]

console.table(groupedData)

// Use one Y-axis scale that fits all three datasets.
const yScale = d3.scaleLinear()
  .domain([0, d3.max(
    [...periodData, ...movieData, ...tvData],
    d => d.averageViews
  )])
  .nice()
  .range([380, 50])

 // Animate bars growing from the baseline.
// Draw movie and TV bars side by side for each release period.
svg.selectAll('rect')
  .data(groupedData)
  .join('rect')
  .attr('x', d => xScale(d.period) + xSubScale(d.type))
  .attr('width', xSubScale.bandwidth())
  .attr('y', 380)
  .attr('height', 0)
  .attr('fill', d => d.type === 'Movie' ? '#E50914' : '#38BDF8')
  .attr('rx', 13)

  // Highlight the hovered bar and fade the others.
.on('mouseover', function () {
  svg.selectAll('rect')
    .attr('opacity', 0.25)

d3.select(this)
  .attr('opacity', 1)
  .attr('fill', d => d.type === 'Movie' ? '#FF4D5A' : '#7DD3FC')
})
// Restore each bar's original color when the mouse leaves.
.on('mouseout', function () {
  svg.selectAll('rect')
    .attr('opacity', 1)
    .attr('fill', d => d.type === 'Movie' ? '#E50914' : '#38BDF8')
})


 .transition()
.delay((d, i) => i * 350)
.duration(900)
.ease(d3.easeCubicOut)
  .duration(1200)
  .ease(d3.easeCubicOut)
  .attr('y', d => yScale(d.averageViews))
  .attr('height', d => 380 - yScale(d.averageViews))

  // Add the X-axis to show the release periods.
svg.append('g')
  .attr('transform', 'translate(0, 380)')
  .call(d3.axisBottom(xScale))
  .selectAll('text')
  .style('font-size', '13px')

  // Add the Y-axis with average views shown in millions.
svg.append('g')
  .attr('transform', 'translate(100, 0)')
  .call(
    d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => (d / 1000000).toFixed(1) + 'M')
  )

 
// Label the X-axis with release periods.
svg.append('text')
  .attr('x', 425)
  .attr('y', 430)
  .attr('text-anchor', 'middle')
  .attr('fill', 'white')
  .attr('font-size', '15px')
  .text('Release Period')

// Label the Y-axis with average views in millions.
svg.append('text')
  .attr('x', 100)
  .attr('y', 30)
  .attr('text-anchor', 'start')
  .attr('fill', 'white')
  .attr('font-size', '14px')
  .text('Average Views (Millions)')

app.append(() => svg.node())

}

// ---- CLEANING HELPERS ------------------------------------------------------
// CLEAN 2: turn "1:54" into 114 (minutes).
// .split() cuts text into a list wherever it finds the character you give it.
function toMinutes(runtime) {
  if (!runtime) return 0
  const parts = runtime.split( ':' ) //  "1:54" -> ["1", "54"]
  return +parts[0] * 60 + +parts[1] // hours to minutes, plus minutes
}

// CLEAN 3: turn "Action,Comedy" into ["Action", "Comedy"].
// PRE-FILLED: .replace() strips the ( ) and ' that the TV file uses, and
// .trim() removes spaces around each name.
// IMDb writes \N when a movie has no genre. In JavaScript a backslash must
// be typed twice, so you write it as '\\N'.
function parseGenres(text) {
  if (!text) return []
  return text
    .replace(/[()']/g, '')
    .split( ',' ) //                                  cut at each comma
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0 && genre !== '\\N' ) // drop no-genre
}

main()
