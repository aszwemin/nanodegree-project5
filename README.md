Neighbourhood Map Project
==========================

The application consists of the following components:
1. The full page Google map
2. A set of markers in the locations obtained from Google Places API. The set of markers can be filtered based on search results. When the user clicks on the marker, map is centered on it and an infowindow is open with the name of the place and the picture obtained from Google Street View API.
3. A search bar. When user starts typing, suggestions are being shown under the search bar (to filter by type or name, icons differentiate between the two). User can then click on the entry and the markers will be filtered accordingly. Removing all text from the search box resets the application to initial state.
4. A list view showing additional data for the currently visible markers (name, icon, address, phone and reviews, last 3 only if available on Google Places). User can click on the name of the place, and the new tab will open with Google's page about the place. When the user clicks on the body of the result, map will center on the related marker and the infowindow for it will be shown.

Project contains a package.json and gulpfile.js that allow for minifying css and js files. In order to make any changes to css or js files, run npm install and then gulp.