/*
--- the global Geodex object ---
*/
	var Geodex = {
		
		initialize: function() {
			var theMap, // has to be declared here because of all the methods that use it
                graticule = {}; //This also has to be declared here to manage scope (see Geodex.map.graticule)
			this.vocab.defineAttributes(); // get all of the attribute vocabulary
			this.years.populate(); // populate the "years" drop-downs dynamically
			this.series.getAll(); // populate the "series" drop-down dynamically
			this.publishers.getAll(); // populate the "publsihers" drop-down dynamically
            this.map.initialize(); // initialize the map and run all functions that entails 
			this.bookmarks.generateExportFields(); // dymaically create list of fields users may customize export report with
			String.prototype.replaceAll = function(target, replacement) { // function needed to get rid of all apostrophes from search results (apostrophes break dynamically generated SQL)
				return this.split(target).join(replacement);
			};
		},
        
        
		//=====================================================//
		
		years: {
			
			min: 1818, // minimum year for the "years" dropdown
			
			max: new Date().getFullYear(), // maximum year for the "years" dropdown (grabbed dynamically)
			
			// populate drop-downs with all years between min and max
			populate: function() {
				var dropdownYearsList;
				// loop through all years, one at a time, starting with Geodex.years.min and ending with Geodex.years.max
				for (var i = this.min; i <= this.max; i++){
					dropdownYearsList += ('<option value="' + i + '" id="' + i +'">' + i + '</option>');
				}
				// add the list created in the above loop to the dropdown menus
				$('#years-from').html(dropdownYearsList);
				$('#years-to').html(dropdownYearsList);
				// by default, have the latter dropdown default to the last year (so the default search range is all years)
				$('#years-to #' + this.max).prop('selected', true);
			},
			
			// when user selects a year, let her know if date range is invalid
			validate: function() {
				// variable to hold the user's "from year" dropdown selection
				var fromYear = $('#years-from').val();
				// variable to gold the user's "to year" dropdown selection
				var toYear = $('#years-to').val();
				// check if the year selection is invalid (e.g. 2005-2001)
				if (fromYear > toYear) {
					// if so, show the message informing the user that her year selection is invalid
					$('#years-not-in-order').show();
				} else {
					// otherwise, do not show the message (if the year range is valid)
					$('#years-not-in-order').hide();
				}
			},
			
			// return year dropdowns to default at user's request
			toDefault: function() {
				$('#years-from option:first').prop('selected', true);
				$('#years-to option:last').prop('selected', true);
				$('#years-not-in-order').hide(300);
			}
			
		},
		
		//=====================================================//
		
		series: {
			
			field: 'SERIES_TIT', // attribute table field name for the series
			
			array: [], // array to hold all of the series, populated with fillArray method
			
			maximumSeriesLength: 65, // number of characters to display in the series dropdown before cutting off name
			
			ifNull: 'No associated series', // label for records in results with no series
			
			// this method will populate Geodex.series.array; see https://github.com/Esri/esri-leaflet/issues/880
			getAll: function() {
				query = L.esri.query({
					url: Geodex.map.service
				})
				.where('1=1')
				.returnGeometry(false)
				.fields(this.field);
				query.params.returnDistinctValues = true;
				query.run(function(error, results, response) {
					$.each(results.features, function (i, v){
						if (v.properties[Geodex.series.field] !== null){
							Geodex.series.array.push(v.properties[Geodex.series.field]);
						}
						if (i === results.features.length - 1){ // if this is the last series obtained from the Map Service...
							Geodex.series.array.sort(); // ...sort the list into alphabetical order...
							Geodex.series.populate(); // ...and populate the drop-down
						}
					});
				});
			},
			
			// once all of the series have been gotten from Geodex.series.getAll, populate dropdown with this function
			populate: function() { // populate the series drop-down (to be done after getAll)
				var seriesHtml = '<option value="series-none" id="series-none">No series selected</option>';
				$.each(Geodex.series.array, function (i, v){
					if (v.length >= Geodex.series.maximumSeriesLength) { // cut off series name if too long (see Geodex.series.maximumSeriesLength)
						seriesHtml += ('<option value="' + i + '" id="series-' + i +'">' + (v).substring(0, Geodex.series.maximumSeriesLength) + '...</option>');
					} else {
						seriesHtml += ('<option value="' + i + '" id="series-' + i +'">' + v + '</option>');
					}
				});
				$('#series-list').html(seriesHtml);
				$('#series-list').on('click', function(){
					$('#series-list option:first').prop('disabled', true);
				});
			}

		},
		
		//=====================================================//
		
		publishers: {
			
			field: 'PUBLISHER', // attribute table field name for the series
			
			array: [], // array to hold all of the series, populated with fillArray method
			
			maximumPublishersLength: 65, // number of characters to display in the series dropdown before cutting off name
			
			// this method will populate Geodex.publishers.array; see https://github.com/Esri/esri-leaflet/issues/880
			getAll: function() {
				query = L.esri.query({
					url: Geodex.map.service
				})
				.where('1=1')
				.returnGeometry(false)
				.fields(this.field);
				query.params.returnDistinctValues = true;
				query.run(function(error, results, response) {
					$.each(results.features, function (i, v){
						if (v.properties[Geodex.publishers.field] !== null){
							Geodex.publishers.array.push(v.properties[Geodex.publishers.field]);
						}
						if (i === results.features.length - 1){ // if this is the last publisher obtained from the Map Service...
							Geodex.publishers.array.sort(); // ...sort the list into alphabetical order...
							Geodex.publishers.populate(); // ...and populate the drop-down
						}
					});
				});
			},
			
			populate: function() { // populate the series drop-down (to be done after getAll)
				var pubHtml = '<option value="publisher-none" id="publisher-none">No publisher selected</option>';
				$.each(Geodex.publishers.array, function (i, v){
					if (v.length >= Geodex.publishers.maximumPublishersLength) { // cut off publisher name if too long (see Geodex.publishers.maximumPublishersLength)
						pubHtml += ('<option value="' + i + '" id="publisher-' + i +'">' + (v).substring(0, Geodex.publishers.maximumPublishersLength) + '...</option>');
					} else {
						pubHtml += ('<option value="' + i + '" id="publisher-' + i +'">' + v + '</option>');
					}
				});
				$('#publishers-list').html(pubHtml);
				$('#publishers-list').on('click', function(){
					$('#publishers-list option:first').prop('disabled', true);
				});
			}
			
		},
		
		//=====================================================//
		
		bookmarks : {
			
			saved: [], // an array to store all of the user's saved records
			
			exportTableAttributes: ['SERIES_TIT', 'DATE', 'CATLOC', 'RECORD', 'LOCATION', 'SCALE', 'GDX_SUB'], // attribute fields that will show on csv export and printed list
			
			defaultExportTableAttributes: ['SERIES_TIT', 'DATE', 'CATLOC', 'RECORD', 'LOCATION', 'SCALE', 'GDX_SUB'],
			
			// if user clicks "bookmark" icon link, add or remove record from saved list (determined by link class)
			bookmarkLinkClick: function(linkClicked){
				console.log('bookmark link clicked!');
				var thisIsAddLink = $(linkClicked).hasClass('add-bookmark');
				if(thisIsAddLink) {
					$('#no-saved-records').empty();
					var bookmarkThis = $(linkClicked).attr('id').replace('add-bookmark-', '');
					Geodex.bookmarks.saved.push(bookmarkThis);
					$(linkClicked).removeClass('add-bookmark');
					$(linkClicked).addClass('remove-bookmark');
					$(linkClicked).attr('id', ('remove-bookmark-' + bookmarkThis));
					$(linkClicked).html('<i class="fa fa-lg fa-bookmark" aria-hidden="false"></i>')
					$('#num-bookmarked').html(Geodex.bookmarks.saved.length);
				} else {
					var unbookmarkThis = $(linkClicked).attr('id').replace('remove-bookmark-', '');
					var unbookmarkIndex = Geodex.bookmarks.saved.indexOf(unbookmarkThis);
					if (unbookmarkIndex > -1) {
						Geodex.bookmarks.saved.splice(unbookmarkIndex, 1);
					}
					$(linkClicked).removeClass('remove-bookmark');
					$(linkClicked).addClass('add-bookmark');
					$(linkClicked).attr('id', ('add-bookmark-' + unbookmarkThis));
					$(linkClicked).html('<i class="fa fa-lg fa-bookmark-o" aria-hidden="false"></i>')
					$('#num-bookmarked').html(Geodex.bookmarks.saved.length);
				};
			},
			
			// update the list of saved records per user's request
			updateRecordsList: function() {
				if(Geodex.bookmarks.saved.length > 0) {
					this.createExportTable();
					var bookmarksHtml = '<ul class="list-group">';
					bookmarksQuery = L.esri.query({
						url: Geodex.map.service
					});
					bookmarksQuery.featureIds(Geodex.bookmarks.saved);
					bookmarksQuery.run(function(error, results, response) {
						$.each(results.features, function(i, v) {
							var loc = v.properties.LOCATION;
							var date = v.properties.DATE;
							var rec = v.properties.RECORD;
							var oid = v.properties.OBJECTID;
							var ser = v.properties.SERIES_TIT;
							if (loc === null) {
								loc = '';
							} else {
								loc = ': ' + loc;
							}
							bookmarksHtml += ('<li class="list-group-item"><a href="#" class="show-map-outline-link" id="show-outline-' + oid +'"><i class="fa fa-lg fa-map" aria-hidden="true"></i></a><a href="#" class="attr-modal-link" id="info-' + oid + '" data-toggle="modal" data-target="#attrModal"><i class="fa fa-lg fa-info-circle aria-hidden="false"></i></a>');
							var checkBookmark = oid.toString();
							if (Geodex.bookmarks.saved.indexOf(checkBookmark) >= 0) {
								bookmarksHtml += ('<a href="#" class="bookmark-link remove-bookmark" id="remove-bookmark-' + checkBookmark + '"><i class="fa fa-lg fa-bookmark" aria-hidden="false"></i></a>');
							} else {
								bookmarksHtml += ('<a href="#" class="bookmark-link add-bookmark" id="add-bookmark-' + checkBookmark + '"><i class="fa fa-lg fa-bookmark-o" aria-hidden="false"></i></a>');
							}
							bookmarksHtml += '<span class="search-result">' + date + ' &ndash; ' + rec + loc + '</span></li>';
							if ((results.features.length - 1) === i) {
								bookmarksHtml += '</ul>';
								$('#saved-records-list').html(bookmarksHtml).promise().done(function(){
									$('.show-map-outline-link').off();
									$('.show-map-outline-link').click(function(){
										$('.list-group-item').css('background-color', '');
										$(this).parents('.list-group-item').css('background-color', '#ffffcc');
										Geodex.map.showFeatureOutline($(this).attr('id').replace('show-outline-', ''));
									});
									$('.bookmark-link').off();
									$('.attr-modal-link').off();
									$('.bookmark-link').click(function() {
										Geodex.bookmarks.bookmarkLinkClick(this);
									});
									$('.attr-modal-link').click(function() {
										Geodex.search.getAttributeTable(this);
									});
								});
							}
						});
					});
				}
			},
			
			generateExportFields: function() {
				
			},

			// dynamically update the export table, used for the csv export and printed table
			createExportTable: function() {
				$('#export-table').empty();
				var exportTableHtml = '<thead><tr>';
				$.each(this.exportTableAttributes, function(i, v){
					exportTableHtml += ('<td>' + v + '</td>');
				})
				exportTableHtml += '</tr></thead><tbody>';
				var exportTableQuery = L.esri.query({
					url: Geodex.map.service
				});
				var exportTableSql = '';
				$.each(Geodex.bookmarks.saved, function(i, v){
					exportTableSql += ('OBJECTID = ' + v);
					if (i !== (Geodex.bookmarks.saved.length - 1)){
						exportTableSql += ' OR ';
					}
				});
				exportTableQuery.where(exportTableSql).fields(this.exportTableAttributes).returnGeometry(false);
				exportTableQuery.run(function(error, results, response){
					$.each(results.features, function (i, v) {
						exportTableHtml += '<tr>'
						$.each(Geodex.bookmarks.exportTableAttributes, function(i2, v2) {
							exportTableHtml += ('<td>' + v.properties[v2] + '</td>');
						});
						exportTableHtml += '</tr>'
						if (i === (results.features.length -1)) {
							exportTableHtml += '</tbody>';
							$('#export-table').html(exportTableHtml);
						}
					});
					$('#export-table').tableExport({
						fileName: 'geodex_records',
						formats: ['xls']
					});
					$('#print').remove();
					$('#bookmarks').append('<button id="print" class="btn btn-default"><i class="fa fa-print" aria-hidden="true"></i> Print</button>');
					$('#print').click(function() {
						window.print();
					});
				});
			}
		},
		
		//=====================================================//
		
		search : { // all of the search options available to the user
		
			series: [], // all of the series the user wishes to search
			
			publishers: [], // all of the publishers the user wishes to search
			
			// user adds a series to her seach parameters
			addSeries: function(i) {
				if (($.inArray(Geodex.series.array[i], Geodex.search.series)) === -1) {
					Geodex.search.series.push(Geodex.series.array[i])
					$('#series-to-be-searched').append('<span class="series-span" id="uniqueseries-' + i + '">' + Geodex.series.array[i] + ' <button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></span>');
					// add event listener for removeSeries
					$('.series-span .close').off();
					$('.series-span .close').click(function(){
						var par = $(this).parent();
						var idx = $(par).attr('id').replace('uniqueseries-', '');
						Geodex.search.removeSeries(par, idx);
					});
				};
			},
			
			// user adds a publisher to her seach parameters
			addPublisher: function(i) {
				if (($.inArray(Geodex.publishers.array[i], Geodex.search.publishers)) === -1) {
					Geodex.search.publishers.push(Geodex.publishers.array[i])
					$('#publishers-to-be-searched').append('<span class="publisher-span" id="uniquepublisher-' + i + '">' + Geodex.publishers.array[i] + ' <button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></span>');
					// add event listener for removeSeries
					$('.publisher-span .close').off();
					$('.publisher-span .close').click(function(){
						var par = $(this).parent();
						var idx = $(par).attr('id').replace('uniquepublisher-', '');
						Geodex.search.removePublisher(par, idx);
					});
				};
			},
			
			// user removes a series from her search parameters
			removeSeries: function(p, i) {
				var index = this.series.indexOf(Geodex.series.array[i]);
				this.series.splice(index, 1);
				$(p).remove();
			},
			
			// user removes a publisher from her search parameters
			removePublisher: function(p, i) {
				var index = this.publishers.indexOf(Geodex.publishers.array[i]);
				this.publishers.splice(index, 1);
				$(p).remove();
			},
			
			// create the sql query used for searching (based on user search parameters)
			sql: function() {
				// look at years dropdown to determine date range
				var fromThisYear = $('#years-from').val();
				var toThisYear = $('#years-to').val();
				var query = ('DATE >= ' + fromThisYear + ' AND DATE <= ' + toThisYear);
				// has the user selected any series?
				if (Geodex.search.series.length > 0) {
					query += ' AND ( ';
					$.each(Geodex.search.series, function(i, v) {
						var s = v.replaceAll("'", "''");
						query += ("SERIES_TIT = '" + s + "'");
						if (i < Geodex.search.series.length - 1) {
							query += ' OR ';
						} else {
							query += ' )';
						}
					});
				}
				// has the user selected any publishers?
				if (Geodex.search.publishers.length > 0) {
					query += ' AND ( ';
					$.each(Geodex.search.publishers, function(i, v) {
						var s = v.replaceAll("'", "''");
						query += ("PUBLISHER = '" + s + "'");
						if (i < Geodex.search.publishers.length - 1) {
							query += ' OR ';
						} else {
							query += ' )';
						}
					});
				}
				// does the user only want records in the AGSL holdings?
				if($('#agsl-holdings-option').prop('checked')) {
					query += ' AND HOLD >= 1';
				}
				// has the user entered anything in "Name Contains" field?
				if($('#name-contains').val() !== '') {
					var nameVal = ($('#name-contains').val()).toUpperCase();
					console.log(nameVal);
					query += " AND (LOCATION LIKE '%" + nameVal + "%' OR RECORD LIKE '%" + nameVal + "%')";
				}
				console.log(query);
				return query;
			},
			
			// user's saved zoom level, which can be referenced later (see go function)
			savedBounds: 0,
			
			// perform search
			go: function() {
				// collect information about user's current view, and allow her to return to it later
				Geodex.map.savedBounds = theMap.getBounds();
				if($('#return-to-search-extent').is(':hidden') && !$('#no-search-extent').prop('checked')) {
					$('#return-to-search-extent').show(100);
				} else if ($('#return-to-search-extent').is(':visible') && $('#no-search-extent').prop('checked')) {
					$('#return-to-search-extent').hide(100);
				}
				$('#return-to-search-extent').click(function(e) {
					e.preventDefault();
					theMap.fitBounds(Geodex.map.savedBounds);
				});
				// actually perform the search
				var geoSearch = true;
				if ($('#no-search-extent').prop('checked')) {
					geoSearch = false;
				}
				if(geoSearch) {
					var currentMapBounds = theMap.getBounds(); // get the boundaries of the current map extent
					var sw = currentMapBounds._southWest; // assign the southwest boundary to a variable
					var ne = currentMapBounds._northEast; // assign the northeast boundary to a variable
					var queryBounds = L.latLngBounds(sw, ne); // combine the boundaries into a leaflet latlong object
				}
				var sql = Geodex.search.sql();
				var search = L.esri.query({
					url: Geodex.map.service
				});
				if ($('#search-intersect').prop('checked')) {
					search.intersects(queryBounds)
					.where(sql);
				} else if ($('#search-within').prop('checked')) {
					search.within(queryBounds)
					.where(sql);
				} else if ($('#no-search-extent').prop('checked')) {
					search.where(sql);
				}
				search.run(function(error, results, response) {
					if($('#exclude-large-maps').prop('checked')) {
						// if user is searching with intersect, she has the option to exclude large maps
						// first thing to do: gather objectids of all results from the first query
						var objectids = [];
						$.each(results.features, function(i, v) {
							objectids.push(v.id);
						});
						// then run a second query, returning only results from the 1st query that also match this second one
						var largerArea = queryBounds.pad(0.5);
						excludeQuery = L.esri.query({
							url: Geodex.map.service
						});
						excludeQuery.within(largerArea);
						excludeQuery.featureIds(objectids);
						excludeQuery.run(function (error2, results2, response2) {
							Geodex.search.displayResults(results2.features);
						});
					} else {
						Geodex.search.displayResults(results.features);
					}
				});
			},
			
			// dynamically display search results in an organized list
			displayResults: function(s) {
				$('#num-results').html(s.length);
				if (s.length === 1000) {
					alertHtml = this.alerts.tooMany;
				} else if (s.length > 100 && s.length < 1000) {
					alertHtml = this.alerts.almostTooMany;
				} else {
					alertHtml = '';
				}
				var resultsHtml = ('<h2>Seach Results</h2>' + alertHtml + '<p>' + 'Found <strong>' + s.length + '</strong> results in ');
				var seriesSort = []
				$.each(s, function(i, v) {
					if(seriesSort.indexOf(s[i].properties[Geodex.series.field]) < 0) {
						seriesSort.push(s[i].properties[Geodex.series.field]);
					}
				});
				if (seriesSort.indexOf(null) >= 0)  {
					var index = seriesSort.indexOf(null);
					seriesSort[index] = Geodex.series.ifNull;
				}
				resultsHtml += ('<strong>' + seriesSort.length + '</strong> series.</p>')
				$.each(seriesSort, function(i, v){
					resultsHtml += ('<h3>' + v + '</h3>' + '<ul class="list-group">' + Geodex.search.makeResultsList(seriesSort[i], s) + '</ul>')
				});
				$('#search-results').html(resultsHtml).promise().done(function(){
					$('.show-map-outline-link').off();
					$('.show-map-outline-link').click(function(){
						$('.list-group-item').css('background-color', '');
						$(this).parents('.list-group-item').css('background-color', '#ffffcc');
						Geodex.map.showFeatureOutline($(this).attr('id').replace('show-outline-', ''));
					});
					$('.bookmark-link').off();
					$('.attr-modal-link').off();
					$('.bookmark-link').click(function() {
						Geodex.bookmarks.bookmarkLinkClick(this);
					});
					$('.attr-modal-link').click(function() {
						Geodex.search.getAttributeTable(this);
					});
					$('#tab-results').click();
				});
			},
			
			// helps displayResults make an organized list
			makeResultsList: function(category, s) {
				var listToReturn = '';
				$.each(s, function(i, v){
					var loc = v.properties.LOCATION;
					var date = v.properties.DATE;
					var rec = v.properties.RECORD;
					var oid = v.properties.OBJECTID;
					var ser = v.properties.SERIES_TIT;
					if (loc === null) {
						loc = '';
					} else {
						loc = ': ' + loc;
					}
					if(category === ser  || (category === "No associated series" && ser === null)) {
						listToReturn += ('<li class="list-group-item"><a href="#" class="show-map-outline-link" id="show-outline-' + oid +'"><i class="fa fa-lg fa-map" aria-hidden="true"></i></a><a href="#" class="attr-modal-link" id="info-' + oid + '" data-toggle="modal" data-target="#attrModal"><i class="fa fa-lg fa-info-circle aria-hidden="false"></i></a>');
						var checkBookmark = oid.toString();
						if (Geodex.bookmarks.saved.indexOf(checkBookmark) >= 0) {
							listToReturn += ('<a href="#" class="bookmark-link remove-bookmark" id="remove-bookmark-' + checkBookmark + '"><i class="fa fa-lg fa-bookmark" aria-hidden="false"></i></a>');
						} else {
							listToReturn += ('<a href="#" class="bookmark-link add-bookmark" id="add-bookmark-' + checkBookmark + '"><i class="fa fa-lg fa-bookmark-o" aria-hidden="false"></i></a>');
						}
						listToReturn += '<span class="search-result">' + date + ' &ndash; ' + rec + loc + '</span></li>';
					}
					
				});
				return listToReturn;
			},
			
			// let the user know if her search has too many or almost too many results
			alerts: {
				maxResults: 1000,
				manyResults: 100, // triggers the "you may want to edit your search" alert
				tooMany: ('<div class="alert alert-danger" role="alert"><strong>Your search returned too many results. Only the first 1000 will be displayed below.</strong> Adjust your search parameters to return more specific records.</div>'),
				almostTooMany: ('<div class="alert alert-warning" role="alert"><strong>Your search returned more than 100 results.</strong> All of them are displayed below. You may wish to adjust your search parameters to return more specific records.</div>')
			},
			
			// if user clicks the info icon next to a record, bring up attribute table in modal
			getAttributeTable: function(linkClicked) {
				var featureToLookup = ($(linkClicked).attr('id')).replace('info-', '');
				var attrQuery = L.esri.query({
					url: Geodex.map.service
				});
				attrQuery.where('"OBJECTID" = '+ featureToLookup);
				attrQuery.run(function(error, results, response){
					var attr = results.features[0].properties;
					var attrKeys = Object.keys(attr);
					if (attr.LOCATION === null) {
						var loc = '';
					} else {
						var loc = ': ' + attr.LOCATION;
					}
					$('#attrModalLabel').html('<strong>Attributes:</strong> ' + attr.DATE + ' &ndash; ' + attr.RECORD + loc);
					$.each(attrKeys, function(i, v) {
						var currentAttribute = v;
						var currentValue = attr[currentAttribute];
						if(currentAttribute in Geodex.vocab.attributes) {
							if (Geodex.vocab.attributes[currentAttribute].length > 1) {
								currentValue = Geodex.vocab.attributes[currentAttribute][1][currentValue];
							};
							currentAttribute = Geodex.vocab.attributes[currentAttribute][0];
						}
						var tableRowHtml;
						if (currentAttribute === "NautChartID" || currentAttribute === "OBJECTID" || currentAttribute === "GDX_FILE" || currentAttribute === "GDX_NUM" || currentAttribute === "RUN_DATE" || currentAttribute === "Shape_Area" || currentAttribute === "Shape_Length" || currentAttribute === Geodex.vocab.attributes["YEAR1_TYPE"][0] || currentAttribute === Geodex.vocab.attributes["YEAR2_TYPE"][0] || currentAttribute === Geodex.vocab.attributes["YEAR3_TYPE"][0] || currentAttribute === Geodex.vocab.attributes["YEAR4_TYPE"][0]) {
							// do nothing
						} else if ((currentValue === null || currentValue === "Not assigned" || currentValue === undefined) && (currentAttribute !== Geodex.vocab.attributes["YEAR1"][0] && currentAttribute !== Geodex.vocab.attributes["YEAR2"][0] && currentAttribute !== Geodex.vocab.attributes["YEAR3"][0] && currentAttribute !== Geodex.vocab.attributes["YEAR4"][0])) {
							tableRowHtml = ( '<tr><td><strong>' + currentAttribute + '</strong></td><td><span class="null-value">Not assigned</span></td></tr>' );
							if (i === 0 || i <= ((attrKeys.length / 2) - 1)) { // throw the first half of all attributes in table #1
                                    $('#attr-table-1>tbody').append(tableRowHtml);
							} else  { // throw the rest in table #2
								$('#attr-table-2>tbody').append(tableRowHtml);
							}
						} else {
							if (currentAttribute === Geodex.vocab.attributes["YEAR1"][0] || currentAttribute === Geodex.vocab.attributes["YEAR2"][0] || currentAttribute === Geodex.vocab.attributes["YEAR3"][0] || currentAttribute === Geodex.vocab.attributes["YEAR4"][0]) {
								if(currentValue === null) {
									tableRowHtml = ( '<tr><td><strong>' + currentAttribute + '</strong></td><td><span class="null-value">Not assigned</span></td></tr>' );
								} else {
									// process the years attributes a little differently, for formatting purposes
									switch(currentAttribute) {
										case "Year 1":
											var yearType = "YEAR1_TYPE";
											break;
										case "Year 2":
											var yearType = "YEAR2_TYPE";
											break;
										case "Year 3":
											var yearType = "YEAR3_TYPE";
											break;
										case "Year 4":
											var yearType = "YEAR4_TYPE";
											break;
									}
									tableRowHtml = ( '<tr><td><strong>' + currentAttribute + '</strong></td><td>' + Geodex.vocab.domains.yearType[attr[yearType]] + ' ' + currentValue + '</td></tr>' );
								}
							} else {
								tableRowHtml = ( '<tr><td><strong>' + currentAttribute + '</strong></td><td>' + currentValue + '</td></tr>' );
							}
							if (i === 0 || i <= (((attrKeys.length - 4) / 2) - 1)) { // throw the first half of all attributes in table #1
								$('#attr-table-1>tbody').append(tableRowHtml);
							} else  { // throw the rest in table #2
								$('#attr-table-2>tbody').append(tableRowHtml);
							}
						}
					});
				});
			}
		},
		
		//=====================================================//
		
		map: { // all of the stuff related to the map itself -- most of the Leaflet stuff will be here
			// url to map service
			service: 'https://webgis.uwm.edu/arcgisuwm/rest/services/AGSL/GeodexWebMapService/MapServer/0',
                    
            // adds geocoder (through plug-in)
			addGeocoder: function() {
				/*var geocoderControl = L.esri.Geocoding.geosearch();
				geocoderControl.addTo(theMap);*/
				/*var provider = new GoogleProvider({
					params: {
						key: ''
					}
				});*/
				var provider = new GeoSearch.OpenStreetMapProvider();
				var searchControl = new GeoSearch.GeoSearchControl({
					provider: provider,
				});
				searchControl.addTo(theMap);
			},
			
            
            
            
            // when user first loads the page, the map is set to this view   
            
            
            defaultView: {
				coordinates: [43.380099, -91.252441],
				zoom: 4
			},
			// these need to be kept in tact for feature querying to work properly
			maxBounds: [[-180, -180], [180, 180]],
			// minimum and maximum zoom levels
			zoom: {
				min: 4,
				max: 19
			},
            
            graticule: {
                define: function() {
                    graticule = (L.latlngGraticule({
                        showLabel: true,
                        color: 'black',
                        dmd: true,
                        weight: 0.8,
                        opacity: 1,
                        font: '18px Veranda',
                        zoomInterval: {   
                            latitude: [
                                {start: 4, end: 4, interval: 10}, //Every 10 degrees
                                {start: 5, end: 6, interval: 5}, //Every 5 degrees
                                {start: 7, end: 8, interval: 1}, //Every 1 degrees
                                {start: 9, end: 9, interval: 1/2}, //Every 30 minutes
                                {start: 10, end: 11, interval: 1/6}, // every 10 minutes
                                {start: 12, end: 13, interval: 1/12}, // every 5 minutes
                                {start: 14, end: 15, interval: 1/60}, //every minute
                                {start: 16, end: 19, interval: 1/120} // every 30 seconds (recommend using sec = true)
                            ],
                            longitude: [
                                {start: 4, end: 4, interval: 10}, //Every 10 degrees
                                {start: 5, end: 6, interval: 5}, //Every 5 degrees
                                {start: 7, end: 8, interval: 1}, //Every 1 degrees
                                {start: 9, end: 9, interval: 1/2}, //Every 30 minutes
                                {start: 10, end: 11, interval: 1/6}, // every 10 minutes
                                {start: 12, end: 13, interval: 1/12}, // every 5 minutes
                                {start: 14, end: 15, interval: 1/60}, //every minute
                                {start: 16, end: 19, interval: 1/120} // every 30 seconds (recommend using sec = true)
                            ]
                        }
                    }));
                    return graticule
                }
            },
            
            
            // an object containing all of the basemaps, to be cycled through dynamically
			basemaps: {
				defaultBasemap: 'Esri World Topographic Map',
				data: [
					{
						name: 'Esri World Topographic Map',
						layerUrl: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
						attr: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
					},
					{
						name: 'Esri World Imagery',
						layerUrl: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
						attr: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
					},
					{
						name: 'Esri World Street Map',
						layerUrl: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
						attr: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
					},
					{
						name: 'OSM Mapnik',
						layerUrl: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
						attr: 'Basemap &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}
				],
				// load all of the basemaps dynamically!

                
				load: function() {
					var basemapsObject = {};
					$.each(Geodex.map.basemaps.data, function(i, v){
						basemapsObject[v.name] = (L.tileLayer(v.layerUrl, {
							minZoom: Geodex.map.zoom.min,
							maxZoom: Geodex.map.zoom.max,
							attribution: v.attr
						}))
					});
					(basemapsObject[Geodex.map.basemaps.defaultBasemap]).addTo(theMap);
					var basemapsControl = L.control.layers(basemapsObject).addTo(theMap);
				}
			},

            
			// is a search outline currently visible on the map?
			hasSearchResultOutline: false,
			// does the user want to disable auto-zoom?
			zoomLock: false,
			// does the user want to disable auto-pan?
			panLock: false,
			// all of the stuff necessary to set up the map
			initialize: function(){
				theMap = L.map('map')
					.setView(Geodex.map.defaultView.coordinates, Geodex.map.defaultView.zoom)
					.setMaxBounds(Geodex.map.maxBounds);
                
				Geodex.map.basemaps.load();
				Geodex.map.addGeocoder();
				Geodex.map.addOutlineControl();
				Geodex.map.addAgslLogo();
				$('#current-zoom-level').html(Geodex.map.defaultView.zoom);
				theMap.on('zoomend', function(){
					var currentZoom = theMap.getZoom();
					$('#current-zoom-level').html(currentZoom);
				});
			},
			// default outline color
			outlineColor: 'crimson',
			// all possible outline colors
			outlineColorOptions: ['crimson', 'royalblue', 'yellow', 'limegreen', 'black'],
			// function to add custom outline control (sw corner of map frame)
			addOutlineControl: function() {
				var outlineControl = L.Control.extend({
					options: {
						position: 'bottomleft'
					},
					onAdd: function(theMap) {
						var container = L.DomUtil.create('div', 'outline-control');
						return container;
					}
				});
                
				theMap.addControl(new outlineControl());
				var colorControlHtml = '<p>Outline color: <select id="color-control-select">';
				
                //Add graticule checkbox, formatted as a slider switch
                var graticuleHtmlSlider = '';

                graticuleHtmlSlider = '<p>Show graticule grid: <label class="switch"><input type="checkbox" id="graticule-control-check"><span class="slider round"></span></label></p>'
                $('.outline-control').append(graticuleHtmlSlider);
                                
                $.each(Geodex.map.outlineColorOptions, function(i, v) {
					colorControlHtml += '<option value="' + v + '">' + v + '</option>';
					if(i === (Geodex.map.outlineColorOptions.length - 1)) {
						colorControlHtml += '</select></p>'
						$('.outline-control').append(colorControlHtml);
					}
				});
                
				$('#color-control-select').css('border', '2px solid ' + Geodex.map.outlineColor);
				var panZoomHtml = '<p>Automatic pan: <select id="panzoom-control-select">';
				$.each(Geodex.map.panZoomOptions, function(i, v) {
					panZoomHtml += '<option value="' + i + '">' + v.label + '</option>';
					if(i === (Geodex.map.panZoomOptions.length - 1)) {
						panZoomHtml += '</select></p>'
						$('.outline-control').append(panZoomHtml);
					}
				});
                
				var returnToExtentHtml = '<a href="#" id="return-to-search-extent" style="display:none;">Return to search extent</a>';
				$('.outline-control').append(returnToExtentHtml);
				$('#color-control-select').change(function() {
					Geodex.map.outlineColor = $(this).val();
					$('#color-control-select').css('border', '2px solid ' + Geodex.map.outlineColor);
					if(Geodex.map.hasSearchResultOutline) {
						temporaryLayerGroup.setStyle({color: Geodex.map.outlineColor});
					}
				});
				$('#panzoom-control-select').change(function() {
					userOption = $(this).val();
					userOption = parseInt(userOption);
					Geodex.map.zoomLock = Geodex.map.panZoomOptions[userOption].zoomlock;
					Geodex.map.panLock = Geodex.map.panZoomOptions[userOption].panlock;
				});
                
                //graticule checkbox change function
                $('#graticule-control-check').change(function(){
                    if ( $(this).is(':checked') ) {
                        var gratCheck = true;
                        Geodex.map.graticule.define();
                        graticule.addTo(theMap);
                    } else {
                        var gratCheck = false;
                        graticule.removeFrom(theMap);
                    }
                    //console.log(gratCheck)
                });
                
			},
			// function to add AGSL logo to se corner of map frame
			addAgslLogo: function () {
				var agslControl = L.Control.extend({
					options: {
						position: 'bottomright'
					},
					onAdd: function(theMap) {
						var container = L.DomUtil.create('div', 'agsl-control');
						return container;
					}
				});
				theMap.addControl(new agslControl());
				var agslLogoHtml = '<a href="http://uwm.edu/" target="_blank"><img src="/agsl/geodex-web-map/uwm_logo.png" title="University of Wisconsin-Milwaukee" /></a>';
				$('.agsl-control').html(agslLogoHtml);
            },
        
			// auto-pan options available to the user, available in the custom control
			panZoomOptions: [
				{label: 'Pan and zoom to outline', zoomlock: false, panlock: false},
				{label: 'Pan to outline if outside extent', zoomlock: true, panlock: false},
				{label: 'No automatic panning or zooming', zoomlock: true, panlock: true}
				],
            
			// function for removing feature outline from the map
			removeFeatureOutline: function() {
				temporaryLayerGroup.remove();
				Geodex.map.hasSearchResultOutline = false;
			},
			// when user wants to view a feature outline, query the server and display it
			showFeatureOutline: function(featureId){
				var windowWidth = $(window).width();
				if (windowWidth < 1200) {
					$('#toggle-pane-link').html('Show search panes');
					$('#search-column').hide(300);
					$('#map').show(300).promise().done(function() {
					theMap.invalidateSize(true); // Leaflet method to account for dynamic map size change
					});
				}
				if (Geodex.map.hasSearchResultOutline) {
					Geodex.map.removeFeatureOutline();
				}
				var boundsQuery = L.esri.query({
					url: Geodex.map.service
				})
				.where('"OBJECTID" = '+ featureId)
				.run(function(error, results, response){
					var thisFeaturesGeometry = results.features[0].geometry.coordinates[0];
					for (var i = 0; i < thisFeaturesGeometry.length; i++) {
						thisFeaturesGeometry[i].reverse();
					}
					temporaryLayer = L.polygon(thisFeaturesGeometry, {color: Geodex.map.outlineColor});
					temporaryLayerGroup = L.featureGroup([temporaryLayer]);
					temporaryLayerGroup.addTo(theMap);
					if(Geodex.map.zoomLock && !Geodex.map.panLock) {
						var currentExtent = theMap.getBounds();
						var containTest = currentExtent.contains(thisFeaturesGeometry);
						if(!containTest) {
							var panToHere = temporaryLayer.getBounds().getCenter(); // if necessary, pan to the center of the outline
							theMap.panTo(panToHere, {
								animate: true
							});
						}
					} else if (!Geodex.map.zoomLock && !Geodex.map.panLock) {
						var panAndZoomToHere = temporaryLayer.getBounds();
						theMap.fitBounds(panAndZoomToHere, {
							maxZoom: Geodex.map.zoom.max,
							animate: true
						});
					}
					Geodex.map.hasSearchResultOutline = true;
				});
			}
		},
		
		//=====================================================//
		
		vocab: {
			domains: {
				gdxFile: {
					"1" : "Not Assigned", 
					"2" : "Mexico 1:50,000 (1974- ) [z]", 
					"4" : "France 1:50,000 (Orange Series) [z]", 
					"5" : "Central & Eastern Europe 15 x 30 min. qu", 
					"6" : "Poland 1:25,000 (1928-1938)", 
					"9" : "Tennessee 1:24,000 (Geology)", 
					"10" : "Maryland 1:24,000 (Geology)", 
					"11" : "Desert Access Guides, California 1:100,0", 
					"17" : "South Africa (Geology)", 
					"19" : "Greece (various topographic)", 
					"20" : "World 1:500,000 (Series 1404)", 
					"21" : "German Empire 1:25,000 [z]", 
					"23" : "Great Britain 1:63,360 (7th series)", 
					"24" : "France 1:250,000 (Geology)", 
					"27" : "Europe 1:250,000 (Various AMS)", 
					"28" : "Spain 1:800,000", 
					"29" : "Ireland 1:63,360 (Ordnance Survey)", 
					"30" : "Belgium 1:50,000", 
					"31" : "Switzerland 1:50,000", 
					"32" : "Luxembourg 1:20,000", 
					"33" : "Balkans 1:50,000 (GWM)", 
					"35" : "Italy (Various topographic)", 
					"37" : "Asia 1:250,000 (Various AMS)", 
					"38" : "India 1:126,720 (Survey of India)", 
					"39" : "World 1:250,000 (WAC)", 
					"41" : "United States Land Cover 1:250,000 (L Se", 
					"42" : "Central America 1:50,000 (Various AMS)", 
					"44" : "Mexico 1:100,000 and 1:250,000 photomap", 
					"45" : "Uruguay 1:100,000 (Planimetric)", 
					"46" : "Great Lakes Charts - U.S.(LARGE SCALE)", 
					"47" : "Israel 1:100,000 and 50,000", 
					"48" : "World 1:2,500,000 (Karta Mira) [102]", 
					"49" : "Spain 1:50,000", 
					"50" : "Russia 1:100,000 (German War Maps)", 
					"51" : "Liberia, constituencies 1:250,000", 
					"52" : "[Asia] 1:253,440 (GSGS, Surv. of India)", 
					"53" : "Brazil 1:100,000 [z]", 
					"54" : "Ireland - Town Plans, 1:500", 
					"55" : "Africa (various 1ø quads) 1:200,000 & 1:", 
					"56" : "Venezuela 1:100,000", 
					"57" : "Lithuania 1:100,000 & Latvia 1:75,000", 
					"58" : "Central Europe 1:200,000", 
					"59" : "World 1:1,000,000 (IMW, etc.)", 
					"60" : "Central Europe 1:300,000", 
					"63" : "Germany 1:50,000", 
					"64" : "Russia 1:50,000 (German War Maps)", 
					"65" : "Denmark 1:40,000", 
					"66" : "Egypt 1:50,000 (German War Maps)", 
					"67" : "Cuba 1:62,500", 
					"68" : "Romania 1:100,000", 
					"69" : "British Geological Survey 1:250,000", 
					"71" : "Sudan 1:100,000", 
					"72" : "Great Lakes Charts - U.S. (SMALL SCALE)", 
					"75" : "Peru 1:100,000", 
					"76" : "Argentina 1:100,000", 
					"77" : "Nigeria 1:50,000", 
					"78" : "Iran 1:100,000 & 1:253,440", 
					"79" : "Kenya, Tanzania, Uganda 1:50,000", 
					"80" : "United States 1:100,000 (AMS)", 
					"81" : "Zambia 1:50,000", 
					"82" : "New Zealand 1:63,360", 
					"83" : "World 1:500,000 (GWM)", 
					"85" : "Canada 1:500,000 (NTS)", 
					"86" : "France 1:100,000", 
					"91" : "India 1:1,000,000 (Geological and Minera", 
					"93" : "Ecuador 1:100,000", 
					"94" : "United States (AMS) 1:25,000", 
					"95" : "Argentina 1:50,000", 
					"96" : "Hungary 1:100,000", 
					"97" : "French West Africa 1:500,000", 
					"98" : "Great Britain 1:50,000 (Second series)", 
					"99" : "Malaya-Thailand 1:63,360", 
					"101" : "Arkansas USGS (Various)", 
					"102" : "Alabama USGS (Various)", 
					"103" : "Alaska - USGS (Various)", 
					"104" : "Arizona USGS (Various)", 
					"105" : "California - USGS 1:31,680 AND LARGER", 
					"106" : "California - USGS (Various)", 
					"107" : "Colorado USGS (Various)", 
					"108" : "Connecticut - USGS (Various)", 
					"109" : "Delaware USGS (Various)", 
					"110" : "Florida - USGS (Various)", 
					"111" : "Georgia - USGS (Various)", 
					"112" : "Hawaii - USGS (Various)", 
					"113" : "Idaho - USGS (Various)", 
					"114" : "Illinois - USGS (Various)", 
					"115" : "Indiana - USGS (Various)", 
					"116" : "Iowa - USGS (Various)", 
					"117" : "Kansas - USGS (Various)", 
					"118" : "Kentucky - USGS (Various)", 
					"119" : "Louisiana - USGS (Various)", 
					"120" : "Maine - USGS (Various)", 
					"121" : "Maryland and D.C. - USGS (Various)", 
					"122" : "Massachusetts - USGS (Various)", 
					"123" : "Michigan - USGS (Various)", 
					"124" : "Minnesota - USGS (Various)", 
					"125" : "Mississippi - USGS (Various)", 
					"126" : "Missouri - USGS (Various)", 
					"127" : "Montana - USGS (Various)", 
					"128" : "Nebraska - USGS (Various)", 
					"129" : "Nevada - USGS (Various)", 
					"130" : "New Hampshire - USGS (Various)", 
					"131" : "New Jersey - USGS (Various)", 
					"132" : "New Mexico - USGS (Various)", 
					"133" : "North Carolina - USGS (Various)", 
					"134" : "North Dakota - USGS (Various)", 
					"135" : "New York - USGS (Various)", 
					"136" : "Ohio - USGS (Various)", 
					"137" : "Oklahoma - USGS (Various)", 
					"138" : "Oregon - USGS (Various)", 
					"139" : "Pennsylvania - USGS (Various)", 
					"140" : "Rhode Island - USGS (Various)", 
					"141" : "South Carolina - USGS (Various)", 
					"142" : "South Dakota - USGS (Various)", 
					"143" : "Tennessee - USGS (Various)", 
					"144" : "Texas - USGS (Various)", 
					"145" : "Utah - USGS (Various)", 
					"146" : "Vermont - USGS (Various)", 
					"147" : "Virginia - USGS (Various)", 
					"148" : "Washington - USGS (Various)", 
					"149" : "West Virginia - USGS (Various)", 
					"150" : "Wisconsin - USGS (Various)", 
					"151" : "Wyoming - USGS (Various)", 
					"152" : "United States 1:50,000 (DMA)", 
					"153" : "Puerto Rico (USGS Various)", 
					"154" : "Latin America 1:250,000 (PAIGH)", 
					"155" : "Australia 1:100,000 [z]", 
					"156" : "United States 1:100,000 (1980- )", 
					"157" : "Antarctica 1:250,000 (Geology)", 
					"158" : "United States--Counties, Eastern", 
					"159" : "United States--National Forests 1:24,000", 
					"160" : "United States 1:250,000 (USGS & DMA)", 
					"161" : "United States--Counties, Western", 
					"162" : "Joint Operations Graphics 1:250,000", 
					"163" : "West Germany 1:200,000 (1964-  )", 
					"164" : "Norway 1:50,000 (Series 711)", 
					"165" : "United States--Geology (GQ Series)", 
					"166" : "Australia 1:250,000 (Various)", 
					"167" : "Canada : land information series, 1:250,", 
					"168" : "World 1:1,000,000 (ONC'S)", 
					"169" : "Japan 1:50,000 and 1:200,000 (Geology)", 
					"170" : "Canada 1:250,000 (NTS)", 
					"171" : "World 1:500,000 (TPC Charts)", 
					"172" : "Carta Corografica de Portugal Na Escala", 
					"173" : "Canada 1:50,000 (52ø-88ø) NTS 1-49, 120,", 
					"174" : "Canada 1:50,000 (88ø-141ø) NTS 52-117, 5", 
					"175" : "Sweden 1:50,000", 
					"177" : "Nautical charts (DMA/NOS) -1:399,999", 
					"178" : "Nautical charts (DMA/NOS) 1:400K-1:3.99M", 
					"179" : "Nautical charts (DMA/NOS) 1:4M-", 
					"301" : "Africa 1:1,000,000 & 1:2,000,000", 
					"302" : "Nautical Charts - Coast and Coast & Geod", 
					"303" : "Slovakia 1:100,000", 
					"304" : "Poland 1:100,000 (new series)", 
					"305" : "Europe 1:100,000 (war maps)", 
					"306" : "Soviet Union 1:200,000", 
					"307" : "Canada-Hydrographic Charts (Various)", 
					"308" : "Philippines 1:50,000 (AMS S712)", 
					"309" : "New Zealand Oceanic Series 1:1,000,000", 
					"310" : "Argentina 1:500,000", 
					"311" : "Taiwan 1:50,000 (Geologic)", 
					"312" : "Korea 1:50,000 (AMS)", 
					"313" : "South Africa 1:50,000", 
					"314" : "Ghana, Ivory Coast (Various)", 
					"315" : "Gambia 1:50,000", 
					"316" : "Slovenia 1:50,000", 
					"317" : "Geological map of Thailand 1:250,000", 
					"318" : "USGS (VARIOUS)", 
					"320" : "Ghana, Ivory Coast (VARIOUS)", 
					"323" : "Bolivia 1:100,000 (Series H632z)", 
					"324" : "Paraguay 1:100,00 (Series H642)", 
					"326" : "Yugoslavia (Russian) 1:50,000", 
					"327" : "Great Brittain Ordinance Survey", 
					"328" : "Finland 1:50,000"
				},
				yearType: {
					"97" : "Approximate Date",
					"98" : "Publication Date",
					"99" : "Compilation Date",
					"100" : "Base Map Date",
					"102" : "Field Checked",
					"103" : "Image Year",
					"104" : "Photography to",
					"105" : "Photo Inspected",
					"106" : "Image Date",
					"108" : "Preliminary Edition",
					"109" : "Compiled From Map Dated",
					"110" : "Interim Edition",
					"112" : "Printed",
					"113" : "Printed Circa",
					"114" : "Revised",
					"115" : "Situation/Survey",
					"116" : "Transportation Network",
					"118" : "Provisional Edition",
					"120" : "Photo Revised",
					"121" : "Edition of",
					"119" : "Magnetic Declination Year"
				},
				isoType: {
					"1" : "Isobars Feet",
					"2" : "Isobars Fathoms",
					"3" : "Isobars Meters",
					"4" : "Contours Feet",
					"5" : "Contours Meters",
					"6" : "Multiple Isobar Types",
					"7" : "No Isobar Indicated"
				},
				mapFormat: {
					"0" : "Not assigned",
					"211" : "180° Longitude X-over entry",
					"212" : "180° Longitude X-over entry",
					"47" : "County format",
					"998" : "Geologic map",
					"50" : "Inset on quad",
					"48" : "Irregular format",
					"996" : "Printed map - 2 color",
					"995" : "Printed map - colored",
					"42" : "Quad not entirely mapped",
					"49" : "Quad with inset",
					"45" : "Special quadrangle",
					"41" : "Standard quadrangle",
					"44" : "Std quad with extensions",
					"43" : "Std quad with overlap"
				},
				mapType: {
					"0" : "Not assigned",
					"30" : "Administrative map",
					"1" : "Aerial photograph",
					"6" : "Aeronautical chart",
					"7" : "Bathymetric map",
					"21" : "Coal map",
					"5" : "Geologic map",
					"4" : "Hydrogeologic map",
					"11" : "Land use map",
					"12" : "Nautical chart",
					"13" : "Orthophoto map",
					"14" : "Planimetric map",
					"998" : "Printed map - 2 color",
					"997" : "Printed map - colored",
					"996" : "Printed map - monochrome",
					"995" : "Projection not indicated",
					"15" : "Reference map",
					"16" : "Road map",
					"22" : "Satellite image map",
					"24" : "Shaded relief map",
					"18" : "Topo map (contours)",
					"23" : "Topo map (form lines)",
					"19" : "Topo map (hachures)",
					"25" : "Topo map (irr interval)",
					"20" : "Topo map (layer tints)"
				},
				primeMeridian: {
					"0" : "Not assigned",
					"157" : "Athens PM",
					"999" : "C¢rdoba PM", // is this correct?
					"148" : "Copenhagen PM",
					"135" : "Ferro PM",
					"131" : "Greenwich PM",
					"132" : "Madrid PM",
					"146" : "Munich PM",
					"142" : "Paris PM",
					"138" : "Quito PM",
					"147" : "Rome PM"
				},
				projection: {
					"0": "Not assigned",
					"163" : "Azimuthal equidistant",
					"185" : "Bonne",
					"199" : "Cassini",
					"182" : "Conic equidistant",
					"183" : "Conic",
					"171" : "Cylindrical",
					"180" : "Gauss-Krüger",
					"999" : "Gauss-Krüger",
					"164" : "Gnomonic",
					"186" : "Lambert conformal conic",
					"175" : "Mercator",
					"176" : "Miller",
					"998" : "Munich PM",
					"187" : "Polyconic",
					"198" : "Polyhedric",
					"161" : "Not indicated",
					"178" : "Sinusoidal",
					"168" : "Stereographic",
					"179" : "Transverse Mercator"
				},
				production: {
					"0" : "Not assigned",
					"38" : "Blue line print",
					"39" : "Blueprint",
					"37" : "Negative microform",
					"35" : "Negative photocopy",
					"34" : "Positive photocopy",
					"32" : "Printed map - 2 color",
					"31" : "Printed map - colored",
					"33" : "Printed map - monochrome"
				},
				subs: {
					"0": "Not assigned",
					"1": "Global Coverage",
					"2": "Regional Coverage",
					"3": "Nautical, Aeronautical, and Lake Charts",
					"4": "USGS Topographic Quads"
				}
			},
			attributes: {
				// these have to be defined by a function, AFTER the Geodex object has been defined
			},
			defineAttributes: function() {
				Geodex.vocab.attributes["CATLOC"] = ["Catalog Location"];
				Geodex.vocab.attributes["DATE"] = ["Date"];
				Geodex.vocab.attributes["EDITION_NO"] = ["Edition Number"];
				//Geodex.vocab.attributes["GDX_FILE"] = ["GDX Series"];
				//Geodex.vocab.attributes["GDX_NUM"] = ["GDX File Number"];
				Geodex.vocab.attributes["GDX_SUB"] = ["GDX Subtype", Geodex.vocab.domains.subs];
				Geodex.vocab.attributes["HOLD"] = ["Holdings"];
				Geodex.vocab.attributes["ISO_TYPE"] = ["Isobar Type", Geodex.vocab.domains.isoType];
				Geodex.vocab.attributes["ISO_VAL"] = ["Isobar Value"];
				Geodex.vocab.attributes["LAT_DIMEN"] = ["Latitude Dimension"];
				Geodex.vocab.attributes["LOCATION"] = ["Location"];
				Geodex.vocab.attributes["LON_DIMEN"] = ["Latitude Dimension"];
				Geodex.vocab.attributes["MAP_FOR"] = ["Map Format", Geodex.vocab.domains.mapFormat];
				Geodex.vocab.attributes["MAP_TYPE"] = ["Map Type", Geodex.vocab.domains.mapType];
				Geodex.vocab.attributes["PRIME_MER"] = ["Prime Meridian", Geodex.vocab.domains.primeMeridian];
				Geodex.vocab.attributes["PROJECT"] = ["Projection", Geodex.vocab.domains.projection];
				Geodex.vocab.attributes["PRODUCTION"] = ["Production", Geodex.vocab.domains.production];
				Geodex.vocab.attributes["PUBLISHER"] = ["Publisher"];
				Geodex.vocab.attributes["RECORD"] = ["Record"];
				//Geodex.vocab.attributes["RUN_DATE"] = ["Run Date"];
				Geodex.vocab.attributes["SCALE"] = ["Scale"];
				Geodex.vocab.attributes["SERIES_TIT"] = ["Series"];
				//Geodex.vocab.attributes["Shape_Area"] = ["GIS Shape Area"];
				//Geodex.vocab.attributes["Shape_Length"] = ["GIS Shape Length"];
				Geodex.vocab.attributes["X1"] = ["West"];
				Geodex.vocab.attributes["X2"] = ["East"];
				Geodex.vocab.attributes["Y1"] = ["North"];
				Geodex.vocab.attributes["Y2"] = ["South"];
				Geodex.vocab.attributes["YEAR1_TYPE"] = ["Year 1 Type", Geodex.vocab.domains.yearType];
				Geodex.vocab.attributes["YEAR1"] = ["Year 1"];
				Geodex.vocab.attributes["YEAR2_TYPE"] = ["Year 2 Type", Geodex.vocab.domains.yearType];
				Geodex.vocab.attributes["YEAR2"] = ["Year 2"];
				Geodex.vocab.attributes["YEAR3_TYPE"] = ["Year 3 Type", Geodex.vocab.domains.yearType];
				Geodex.vocab.attributes["YEAR3"] =["Year 3"];
				Geodex.vocab.attributes["YEAR4_TYPE"] = ["Year 4 Type", Geodex.vocab.domains.yearType];
				Geodex.vocab.attributes["YEAR4"] = ["Year 4"]
			}
		}
	}

/*
--- set everything up! ---
*/
	Geodex.initialize();

/*
--- default global event listeners ---
*/

	// when the user changes either year drop-down, check if user has valid year range
	$('#years-from').change(function() {
		Geodex.years.validate();
	});
	$('#years-to').change(function() {
		Geodex.years.validate();
	});
	
	// "Reset years" link
	$('#reset-years').click(function(e) {
		e.preventDefault();
		Geodex.years.toDefault();
	});
	
	// when user selects a series from drop-down, add it to her search paramters
	$('#series-list').change(function() {
		var i = $(this).val();
		Geodex.search.addSeries(i);
	});
	
	// when user selects a publisher from drop-down, add it to her search paramters
	$('#publishers-list').change(function() {
		var i = $(this).val();
		Geodex.search.addPublisher(i);
	});
	
	// user clicks "Search Geodex"
	$('#search-geodex-button').click(function(e) {
		e.preventDefault();
		Geodex.search.go();
	});
	
	// when attribute modal is closed, empty table completely (in anticipation of next record attribute table)
	$('#attrModal').on('hide.bs.modal', function() {
		$('#attr-table-1>tbody').empty();
		$('#attr-table-2>tbody').empty();
	});
	
	// user clicks "Update saved records link"
	$('#update-saved-records-list').click(function(e) {
		e.preventDefault();
		Geodex.bookmarks.updateRecordsList();
	});
	
	// only show "Exclude large maps relative to..." when extent search type is intersect
	$('.extent-radio').click(function() {
		if($('#search-intersect').prop('checked')) {
			$('#exclude-large-area-toggle').show(300);
		} else {
			$('#exclude-large-maps').prop('checked', false);
			$('#exclude-large-area-toggle').hide(300);
		}
	});
	
	// toggle link on the top of the screen in small viewports
	$('#toggle-pane-link').click(function(e) {
		e.preventDefault();
		var animationOptions = {
			duration: 275,
			easing: 'linear'
		}
		if($('#map').is(':visible')) { // is the #map div currently visible?
			$(this).html('Show map');
			$('#map').hide(animationOptions);
			$('#search-column').show(animationOptions);
		} else {
			$(this).html('Show search panes');
			$('#search-column').hide(animationOptions);
			$('#map').show(animationOptions).promise().done(function() {
				theMap.invalidateSize(false); // Leaflet method to account for dynamic map size change
			});
		}
	});
	
	// if user resizes window, check if #map and #search-column need to be re-loaded
	// e.g. if user switches from medium viewport to large one
	$(window).resize(function() {
		var windowWidth = $(window).width();
		if(windowWidth > 1199) {
			$('#map').show();
			$('#search-column').show();
		} else {
			$('#map').hide();
		}
	});


//function onMapClick(e) {
//    console.log("You clicked the map at " + e.latlng);

    //Adds click to print zoom level to console
//    console.log('The Zoom Level is:' + theMap.getZoom());
//}

//theMap.on('click', onMapClick);    

