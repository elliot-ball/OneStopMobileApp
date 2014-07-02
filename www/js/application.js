Zepto(function($){
try{
	var AppStarted = false;
	//Object holding Users Device information
	var ThisDevice= {
		IOS: !!$.os.ios,
		Android: !!$.os.android,
		Version: $.os.version,
		Browser: false
	}
	// Holds somehting about the connection status of the app
	var Connection = {
		status: "offline",
		type: "none",
		online: false,
	}

	//For testing on PC-Browser
	ThisDevice.Browser = false;

	//Set up scrolling elements
	$.each( $('scroll.y'), function(index, item){
		$(item).parent().css({
			"overflow" : "hidden",
			"width" : "100%",
			"max-width" : $(item).width(),
			"min-width" : $(item).width(),
		})
		$(item).css({
			"width" : "100%",
			"max-width" : $(item).width(),
			"min-width" : $(item).width(),
		})
	})

	//Used for controlling Map Zoom
	var transform = {
		start: {},
		end: {},
		center: {},
		dist: {},
		oldScale: 1,
		scale: 1,
		matrix: null,
	}
	//Change CSS based on devcie type
	//IOS Style
	if( ThisDevice.IOS ){
		$('#deviceStyle').attr("href", "css/ios.css");
			if( parseFloat( ThisDevice.Version ) >= 7 ){
				$('page').css({
					"padding-top" : "20px",
				});
			}
	}
	//Android Style
	if( ThisDevice.Android ){
		$('#deviceStyle').attr("href", "css/android.css");
	}
	//Default Style
	if( !ThisDevice.Android && !ThisDevice.IOS ){
		$('#deviceStyle').attr("href", "css/android.css");
	}

	//Auto fill the username and password input fields
	var LAZY = true;
	//Max and Min Zoom
	//Map Width and height based on the Browser OneStop
	//Max number of devices to load before the app slows down
	//Filesystem request size; 0 by default
	var MAXZOOM = 2.0, MINZOOM = 1.0, MAPWIDTH = 1000, MAPHEIGHT = 750, SAFEDEVICES = 30, RequestSize;
	//Server URL's
	var URL = "http://192.168.100.111:1234", ServerURL = URL+"/mobile.asmx";



	//Set up the storage system
	if( ThisDevice.Browser == true ){
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		RequestSize = 0;
	}else{
		RequestSize = 0;
	}
//Capitalise strings
	String.prototype.capitalize = function() {
			return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};
// URL for the server
// URL for the web service

	//Global Objects/Arrays
	//Store user Information
	//Store device informaion
	//Store group infomation
	//Store maps information
	//Store changes
	//store delete information
	var User = new Object(), Groups = new Array(), Devices = new Array(), Maps = new Array(), Changes = new Array(), Delete = new Array()

	var btnAddHit = false, moving = false, openPanel = false;
	var DeviceChange = false, DeviceAddd = false;

// // User object
// 	var User =  new Object();
// // Devices array - Holds all devices for current map
// 	var Devices = new Array();
// // Maps arary - Holds all maps for current Group
// 	var Maps = new Array();
// // Groups array - Holds all the groups the user has access too
// 	var Groups = new Array();
// // Changes array - Holds any changes made by the user, Saving device, editing device, removing device .
// 	var Changes =  new Array();
// // Delete array - Temporary storage for devices about to be deleted, gives users a choice instead of delteing immediatly.
// 	var Delete = new Array();
// Settings object - Stores App infomration and user information. Written to the Users Device HDD
	var Settings = {
		// Logged - true or false if the user is logged in or was logged in. False by default
		logged: false,
		//tiem the user logged in at
		logTime: '',
		// User - object from above.
		user: new Object(),
		// Last update - Each Ajax call to the server will update the information. USed to display how old the data on the device is/was
		lastUpdate: "",
		// Changes - 0 if no changes.json found on the device, 1 if changes.json is found. Asks the user if they want to update from this document.
		changes: 0,
	}
	// Holds the current Map Image;
	var MapImage = false;
	// Holds the current Map object, gotten from the array
	var CurrentMap = new Object();
	// holds the currently selected device. Device from SVG touch events or Device from tapping Device buttons
	var CurrentDevice = new Object();
	// Holds the curernt group that the user is in
	var CurrentGroup = new Object();

	//Device Groups
	var OnMapDevices = new Array(), OffMapDevices = new Array();

	var Shadow = {
		show: function(e){
			if( $('shadow').attr("novis") == ""){
				$('shadow').removeAttr("novis");
			}
		},
		hide: function(e){
			$('shadow').attr("novis", "");
		}
	}

	var LoginPage = {
		show: function(e){
			$('#login').removeAttr("novis");
		},
		hide: function(e){
			$('#login').attr("novis", "");
		}
	}

	var Spinner = {
		show: function (e){
			if( !ThisDevice.Browser ){
				window.plugins.spinnerDialog.show();
			}
		},
		hide: function(e){
			if( !ThisDevice.Browser ){
				window.plugins.spinnerDialog.hide();
			}
		}
	}

	var DeviceImage = {
		show: function(e){
			$('#DeviceImageDisplay').removeAttr("novis")
		},
		hide: function(e){
			$('#DeviceImageDisplay').attr("novis", "")
		},
		loadImage: function( path ){
			$('#DeviceImageDisplay>display.content').empty().append("<img/>");
			var i = $('#DeviceImageDisplay>display.content>img');

			var img = new Image();
			img.src = path;

			img.onload = function(){
				var w = img.width, h = img.height, nw, nh;

				if( h < i.parent().height() && w < i.parent().width()){
					var x = Math.round( i.parent().width()/2 - w/2 );
					var y = Math.round( i.parent().height()/2 - h/2) ;

					console.log(x+" "+y);

					i.width(w);
					i.height(h);
					i.attr("src", img.src);
					i.css({
						"-webkit-transform": "matrix(1,0,0,1,"+1+","+y+")"
					});
				}else{
					var r = i.parent().height() / h, nh = h*r, nw = w*r;

					if( nw > i.parent().width() ){
						r = i.parent().width() / nw, nw = r*nw, nh = r*nh;
					}
					var x = Math.round( i.parent().width()/2 - nw/2 );
					var y = Math.round( i.parent().height()/2 - nh/2) ;

					console.log(x+" "+y);

					i.width(nw);
					i.height(nh);
					i.attr("src", img.src);
					i.css({
						"-webkit-transform": "matrix(1,0,0,1,"+1+","+y+")"
					});
				}
			}
		},
		ClearImage: function(e){
			$('#DeviceImageDisplay>display.content').empty();
		},
		Resizemage: function(){
			if( $('#DeviceImageDisplay').attr("novis") == null) {
				console.log("Resizing");
				console.log(  $('#DeviceImageDisplay').attr("novis") );

				var img = $('#DeviceImageDisplay>display.content>img');
				var w = img.width(), h = img.height(), nw, nh;

				if( h < img.parent().height() && w < img.parent().width()){
					var x = Math.round( img.parent().width()/2 - w/2 );
					var y = Math.round( img.parent().height()/2 - h/2) ;

					img.width( w );
					img.height( h );
					img.css({
						"-webkit-transform": "matrix(1,0,0,1,"+1+","+y+")"
					});
				}else{
					var r = img.parent().height() / h, nh = h*r, nw = w*r;
					if( nw > img.parent().width() ){
						r = img.parent().width() / nw, nw = nw*r, nh = nh*r;
					}
					var x = Math.round( img.parent().width()/2 - nw/2 );
					var y = Math.round( img.parent().height()/2 - nh/2) ;

					img.width( nw );
					img.height( nh );
					img.css({
						"-webkit-transform": "matrix(1,0,0,1,"+1+","+y+")"
					});
				}
			}
		}
	}

// AjaxUserLogin( "craig","password");

	function AjaxUserLogin( login, pass ){
		document.activeElement.blur();
		$(document).blur();
		$.ajax({
			type: "POST",
			url: ServerURL + "/UserLogin",
			contentType: "application/json; charset=utf-8",
			async: true,
			data: JSON.stringify({
				login: login,
				pass: pass
			}),
			dataType: 'json',
			success: function( d, status, xhr ){
				console.log( d.d );

				User = JSON.parse(d.d);

				if(User != 0){
					Settings.changes = 0;
					Settings.logged = true;
					Settings.logTime = GetToday();
					Settings.user = User;

					AddMessage("Login successful", "short", "top");
					setTimeout(function() {
						WriteFile.settings();
					}, 10);

				}else{
					setTimeout(function() {
						Spinner.hide();
						AddMessage("Incorrect Login details", "short", "top")
					}, 50);
				}
			},
			error: function(et, e) {
				setTimeout(function() {
					Spinner.hide();
					AddMessage("Ajax error : " + e.toString(), "long", "top")
				}, 50);
			}
		});
	}

function RequestLocalSystem(){
	if( ThisDevice.Browser == true ){
		return window.TEMPORARY;
	}else{
		return LocalFileSystem.PERSISTENT;
	}
}

var Ajax ={
	// returns all groups that the user group ID has access to based off the groupPath
	// writes the avalible groups to the users Device.
		groups: function( event ){
			$.ajax({
				type: "POST",
				url: ServerURL + "/GetAvalibleGroups",
				contentType: "application/json; charset=utf-8",
				async: true,
				data: JSON.stringify({
					data: Settings.user.ID_Group
				}),
				dataType: 'json',
				success: function( d, status, xhr ){
					Groups = JSON.parse(d.d);
					// LogIt( "Groups Count: " + Groups.length);
					if( Groups != 0){
						WriteFile.groups();
					}

				},
				error: function(et, e) {
				}
			});
		},
	// Downloads maps data from server with ID_Group
		maps: function( event ){
			$.ajax({
				type: "POST",
				url: ServerURL + "/GetMaps",
				contentType: "application/json; charset=utf-8",
				async: true,
				data: JSON.stringify({
					data: CurrentGroup.ID_Group
				}),
				dataType: 'json',
				success: function( d, status, xhr ){
					if( d.d == 0 ){
						Maps.length = 0;
					}else{
						Maps = JSON.parse(d.d);
					}

					Ajax.devices();
				},
				error: function(et, e) {
				}
			});
		},
	// downloads all devices linked to the current groupID
	// writes the Maps and Devices data to a file
	// File name based off ID_Group from currentGroup i.e. 53.json, 31.json
	// calls HTML._ to place the information into their HTML elements
		devices: function( event ){
			$.ajax({
				type: "POST",
				url: ServerURL + "/GetDevices",
				contentType: "application/json; charset=utf-8",
				async: true,
				data: JSON.stringify({
					data: CurrentGroup.ID_Group
				}),
				dataType: 'json',
				success: function( d, status, xhr ){
					if( d.d == 0){
						Devices.length = 0;
					}else{
						Devices = JSON.parse(d.d)
					}
					Settings.lastUpdate = GetToday();
					WriteFile.data();
					AddMessage("Data downloaded", "short", "top");
				},
				error: function(et, e) {
				}
			});
		},
		// Uploads changes made by the user ot the server to be processed
		changes: function( event ){
			//Sort changes data into groups

			if( Changes[Changes.length-1].Date){
				Changes.splice( Changes.length-1, 1);
			}

			$.ajax({
				type: "POST",
				url: ServerURL + "/Tasks",
				contentType: "application/json; charset=utf-8",
				async: true,
				data: JSON.stringify({
					todo: Changes
				}),
				success: function( d, status, xhr){
					Changes.length = 0;
					Settings.changes = 0;
					var s = JSON.parse( d.d );
					console.log( s );
					DrawChangesLog( s );
					RemoveFile.changes();
					Delete.length = 0;
					setTimeout(function() {
						WriteFile.settings();
						WriteFile.data( );
						AddMessage("Upload finished - Check log", "short", "top");

						setTimeout(function() {
							OnMapDevices.length = 0;
							OffMapDevices.length = 0;

							for (var i = 0; i < Devices.length; i++) {
								if( Devices[i].ID_Map == CurrentMap.ID_Map ){
									OnMapDevices.push( Devices[i] );
								}
								if( Devices[i].ID_Map == 0 ){
									OffMapDevices.push( Devices[i] );
								}
							};
							OnMapDevices = SplitIntoGroups( OnMapDevices );
							OffMapDevices = SplitIntoGroups( OffMapDevices );

							OnMapFunctions.empty();
							OffMapFunctions.empty();

							LoadOnMapDevices();
							LoadOffMapDevices();

							setTimeout(function() {
								OnMapFunctions.MoveForward();
							}, 100);

						}, 100);


						DrawDevicesOnMap();
					}, 100);
				},
				error: function( et, e ){
					alert( e );
					$('#logbookLog').append("<p>"+e+"</p>");
					Spinner.hide();
					AddMessage("Upload failed", "short", "top")
				}
			});
		}
	}

	var Camera = {
		getPicture: function( event ){
			try{
				navigator.camera.getPicture(
					Camera.pictureSuccess,
					Camera.pictureFail,
					{
						quality: 50,
						destinationType: navigator.camera.DestinationType.FILE_URI,
						sourceType: navigator.camera.PictureSourceType.CAMERA,
						encodingType: navigator.camera.EncodingType.JPEG,
						saveToPhotoAlbum: true
					}
				);
			}catch(e){
				alert(e.toString());
			}
		},
		getCameraroll: function( event ){
			// alert("getting cameraroll")

			try{
				navigator.camera.getPicture(
					Camera.pictureSuccess,
					Camera.pictureFail,
					{
						quality: 50,
						destinationType: navigator.camera.DestinationType.FILE_URI,
						sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
						encodingType: navigator.camera.EncodingType.JPEG,
					}
				);
			}catch(e){
				alert(e.toString());
			}
		},
		pictureSuccess: function( imgdata ){
			try{
				var n = imgdata.substr( imgdata.lastIndexOf('/') +1 );
				setTimeout(function() {
					NotifyPrompt(
						"Give the image a name",
						function( result ){
							if( result.buttonIndex == 1){
								n = result.input1 + ".jpg";

									for (var i = 0; i < Devices.length; i++) {
										if( Devices[i].ID_Device == CurrentDevice.ID_Device ){
											Devices[i].Image = 'devimg/'+n;

											CurrentDevice = Devices[i];
										}
									};

								AddChanges(CurrentDevice.ID_Device,'image','devimg/'+n);
								// File.write.data();
								WriteFile.data();
								Camera.copyImageToDir( imgdata, n );
							}
						},
						"Device Image",
						["Done","Cancel"],
						CurrentDevice.Description
					);
				}, 10);
			}catch(e){
				alert(StringMe(e));
			}
		},
		pictureFail: function( event ){
			alert("Camera Fail: " + e.toString())
		},
		copyImageToDir: function( imgdata, name ){
			var dir = '';
			//If the image naem is the same as another, the existing image will be repalced and the app will NOT update until it has been restarted/
			setTimeout(function() {
				//copy image
				window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
					fs.root.getDirectory("OSMobile/devimg", {create:true}, function ( de ){
						dir = de.toURL();
						window.resolveLocalFileSystemURI( imgdata, function(fe){
							window.resolveLocalFileSystemURI( dir, function( destination ){

								//Need to remove the old image if it exists
								//then copy the new one to this directory



								////
								////

								fe.copyTo( destination, name, function( ){
									if(GetConnection() == true ){
										try{
											var imgUrl = ServerURL+"/SaveImage";
											var options = new FileUploadOptions();
											options.fileKey = "file";
											options.fileName = name;
											options.mimeType = "image/jpeg";

											var ft = new FileTransfer();

											ft.upload(
												imgdata,
												imgUrl,
												function(){
													// AddMessage("Image uploaded");
													AddMessage("Image uploaded", "short", "top");

													DisplayDeviceInformation();

													DeviceImage.hide();

													setTimeout(function() {
														DeviceImage.show();
														ReadFile.devImg();
													}, 10);

												},
												function( e ){
													alert("Upload Transfer error: " + StringMe(e));
												},
												options
											);
										}catch(e){
											alert("Upload error: " + e.toString());
										}
									}else{
										// AddMessage("Unable to uplaod device image", "error-bad");
										AddMessage("Unable to uplaod device image", "long", "top");
									}
								}, function(e){
									switch( e.code ){
										case 12:
											alert( "Copy Failure: Device image with that name already exists" );
										break;
										default:
											alert(e.code);
										break;
									}
								});
							}, File.error);
						}, File.error);
					}, File.error);
				},File.error);
			}, 100);
		}
	}


function ReturnBlob( data ){
	if( ThisDevice.Browser == true){
		var d = StringMe( data );
		var blob = new Blob([d], {type:'text/plain'});
		return blob;
	}
	else{
		var blob = StringMe( data )
		return blob;
	}
}


	var WriteFile = {
		settings: function(e){
			var fileName = "settings.json", data = Settings;
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
					de.getFile( fileName, {create: true}, function ( fe ){
						fe.createWriter( function ( fw ) {

							fw.onwritestart = function( event){
								console.log("Writing File: " + fileName);
							}
							fw.onwriteend = function ( event ) {
								console.log("Write complete: " + fileName);
								if (Groups.length == 0){
									ReadFile.groups();
								}
							}
							fw.write(  ReturnBlob(data)  );
						}, File.error);
					}, File.error);
				}, File.error);
			}, File.error);
		},
		groups: function(e){
			var fileName = "groups.json", data = Groups;
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/data", {create:true}, function ( de ){
					de.getFile( fileName, {create: true}, function ( fe ){
						fe.createWriter( function ( fw ) {

							fw.onwritestart = function( event){
								console.log("Writing File: " + fileName);
							}
							fw.onwriteend = function ( event ) {
								console.log("Write complete: " + fileName);
								GetFirstGroup();

								setTimeout(function() {
									LoginPage.hide();
									Spinner.hide();
								}, 50);
							}

							fw.write(  ReturnBlob(data)  );

						}, File.error);
					}, File.error);
				}, File.error);
			}, File.error);
		},
		data: function( e ){
			var fileName = CurrentGroup.ID_Group + ".json", data = new Object();
			data.Date = GetToday(); data.Maps = Maps; data.Devices = Devices;
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/data", {create:true}, function ( de ){
					de.getFile( fileName, {create: true}, function ( fe ){
						fe.createWriter( function ( fw ) {

							fw.onwritestart = function( event){
								console.log("Writing File: " + fileName);
							}
							fw.onwriteend = function ( event ) {
								console.log("Write complete: " + fileName);

								DrawAvalibleMaps();
								// DrawAvalibleDevices();
								DrawTotalDevices();
								// DrawOnMapDevices();
								// OnMapFunctions.empty();
								// OffMapFunctions.empty();
								DrawDate();

								Spinner.hide();
								// OnMapFunctions.MoveForward();
							}

							fw.write(  ReturnBlob(data)  );

						}, File.error);
					}, File.error);
				}, File.error);
			}, File.error);
		},
		changes: function(e){
			var fileName = "changes.json", data;
			Changes.splice(Changes.length, 1);
			Changes.push({"Date": GetToday()});
			data = Changes;
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
					de.getFile( fileName, {create: true}, function ( fe ){
						fe.createWriter( function ( fw ) {

							fw.onwritestart = function( event){
								console.log("Writing File: " + fileName);
							}
							fw.onwriteend = function ( event ) {
								Changes.length = 0;
							}

							fw.write(  ReturnBlob(data)  );

						}, File.error);
					}, File.error);
				}, File.error);
			}, File.error);
		}
	}
	var ReadFile = {
		settings: function(e){
			var fileName = 'settings.json'
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
					de.getFile( fileName , {create: false}, function (fe){
						fe.file(function( file ){
							var r = new FileReader();
								r.onload = function(e){
								if(this.result.length > 0){
									var result = JSON.parse(this.result);
									Settings = result;

									if( Settings.logged == true){
										console.log( Settings );
										$('#inputPrevUsername').val( Settings.user.Name );
										$('#inputLogTime').val( Settings.logTime );
									}else{
										console.log("Not logged in");
									}
									//Start App
									if( AppStarted == false){
										StartApp();
									}
								}else{
									$('#inputPrevUsername').val( "No previous user" );
									$('#inputLogTime').val( "  " );

									if( AppStarted == false){
										StartApp();
									}
								}
							};
							r.readAsText(file);
						},File.error);
					},
					function(e){
						if( e.code == 1){
							console.log("Settings file not found.");
							$('#inputPrevUsername').val( "No previous user" );
							$('#inputLogTime').val( "  " );

							if( AppStarted == false){
								StartApp();
							}
						}else{
							File.error(e);
						}
					});
				},File.error);
			},File.error);
		},
		groups: function(e){
			var fileName = "groups.json";
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/data", {create:true}, function ( de ){
					de.getFile( fileName , {create: false}, function (fe){
						fe.file(function( file ){
							var r = new FileReader();
							r.onload = function(e){
								console.log("Reading Groups File");

								if(this.result.length > 0){
									var result = JSON.parse(this.result);
									Groups.length = 0;
									for (var i = 0; i < result.length; i++) {
										Groups.push ( result[i] );
									};
									GetFirstGroup();

									setTimeout(function() {
										LoginPage.hide();
										Spinner.hide();
										$('#btnTogPanel').trigger("tap");
									}, 50);
								}else{
									console.log("No Groups");
								}
							};
							r.readAsText(file);
						},File.error);
					},
					function(e){
						if( e.code == 1){
							if( GetConnection() == true )
								Ajax.groups();
							else
								Spinner.hide();
								AddMessage("Connection offline, Unable to download groups", "long", "bottom");
								alert("Unable to download groups. Please check your connection");
						}else{
							File.error(e);
						}
					});
				},File.error);
			},File.error);
		},
		data: function(e){
			// alert("reading data file")
			console.log("reading data file");
			var fileName = CurrentGroup.ID_Group +".json";
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/data", {create:true}, function ( de ){
					de.getFile( fileName , {create: false}, function (fe){
						fe.file( function( file ){
							var r = new FileReader();
							r.onload = function(e){
								AddMessage("Connection offline - Reading data from this device", "short", "top");
								if( this.result.length > 0){
									var result = JSON.parse(this.result);
									Settings.lastUpdate = StringMe( result.Date );

									Maps.length = 0;
									Devices.length = 0;

									for (var i = 0; i < result.Maps.length; i++) {
										Maps.push ( result.Maps[i] );
									};
									for (var i = 0; i < result.Devices.length; i++) {
										Devices.push ( result.Devices[i] );
									};

									DrawAvalibleMaps();
									// DrawAvalibleDevices();
									DrawTotalDevices();
									// DrawOnMapDevices();
									OnMapFunctions.empty();
									OffMapFunctions.empty();

									DrawDate();
									setTimeout(function() {
										Spinner.hide();
									}, 250);
								}
							}
							r.readAsText(file);
						},File.error);
					},function(e){
						if( e.code == 1){
							if( GetConnection() == true ){
								Ajax.maps()
;							}else{
								Spinner.hide();
								DrawAvalibleMaps();
								DrawTotalDevices();
								// DrawAvalibleDevices();
								// DrawOnMapDevices();
								OnMapFunctions.empty();
								OnMapFunctions.MoveForward();
								AddMessage("Connection offline, Unable to download data", "long", "bottom");
								// alert("Unable to download Data. Please check your connection");
							}
						}else{
							File.error(e);
						}
					});
				},File.error);
			},File.error);
		},
		changes: function(e){
			var fileName = 'changes.json';
			try{
				window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
					fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
						de.getFile( fileName , {create: false}, function (fe){
							fe.file( function( file ){
								var r = new FileReader();
								r.onload = function(e){
									if( this.result.length > 0){
										var result = JSON.parse(this.result);
										alert( result.length );
										Changes = result;
									}else{
										alert("No Changes");
									}
								}
								r.readAsText(file);

							},File.error);
						}, function(e){
							if( e.code == 1){
								Spinner.hide();
								console.log("No chanegs file found");
							}else{
								File.error(e);
							}
						});
					},File.error);
				},File.error);
			}catch(e){
				alert( e.toString() );
			}
		},
		maps: function(e){
			var map = CurrentMap.Path.substr( CurrentMap.Path.lastIndexOf('/')+1), fullpath = '';
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/maps", {create:true}, function ( de ){
					fullpath = de.toURL();
					de.getFile( map, {create: false}, function (fe){
						var fileURL = fe.toURL();
						LoadMap( fileURL );
					},function(e){
						if( e.code == 1){
							if( GetConnection() == true ){
								Download.map( map, fullpath);
							}else{
								ReadFile.forceMissingMap();
								Spinner.hide();
								AddMessage("Connection offline, Unable to download map", "long", "bottom");

								// alert("Unable to download Map. Please check your connection");
							}
						}else{
							File.error(e);
						}
					});
				}, File.error);
			}, File.error);
		},
		forceMissingMap: function( ){

			LoadMap("missing.jpg");
			Spinner.hide();
		},
		devImg: function(e){
			var devimg = CurrentDevice.Image.substr(CurrentDevice.Image.lastIndexOf("/")+1), fullpath = '';
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/devimg", {create:true}, function ( de ){
					fullpath = de.toURL();
					de.getFile( devimg, {create: false}, function (fe){
						var fileURL = fe.toURL();
						DeviceImage.loadImage( fileURL );
					},function(e){
						if( e.code == 1){
							if( GetConnection() == true ){
								Download.devimg( devimg, fullpath);
							}else{
								Spinner.hide();
								alert("Unable to download device image. Please check your connection");
							}
						}else{
							File.error(e);
						}
					});
				}, File.error);
			}, File.error);
		}
	}
	var RemoveFile = {
		settings: function(e){
			var fileName = 'settings.json';
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
					de.getFile( fileName , {create: false}, function (fe){
						fe.remove(null,null);
					},null);
				},File.error);
			},File.error);
		},
		groups: function(e){
			var fileName = 'groups.json'
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/data", {create:true}, function ( de ){
					de.getFile( fileName , {create: false}, function (fe){
						fe.remove(null,null);
					},null);
				},File.error);
			},File.error);
		},
		data: function(e){
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile/data", {create:true}, function ( de ){
					var dr = de.createReader();
						dr.readEntries(function(entries){
							for( var i = 0; i < entries.length; i++){
								entries[i].remove();
							}
						}, null);
				},File.error);
			},File.error);
		},
		changes: function(e){
			var fileName = 'changes.json'
			window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
				fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
					de.getFile( fileName , {create: false}, function (fe){
						fe.remove(null,null);
					},null);
				},File.error);
			},File.error);
		}
	}

	var File = {
		error: function( e ){
			var msg = '';
			switch (e.code) {
				case FileError.ENCODING_ERR:
					msg = 'The url is malformed.';
					break;
				case FileError.INVALID_MODIFICATION_ERR:
					msg = 'The modification requested is not allowed. For example, the app might be trying to move a directory into its own child or moving a file into its parent directory without changing its name';
					break;
				case FileError.INVALID_STATE_ERR:
					msg = 'The operation cannot be performed on the current state of the interface object.';
					break;
				case FileError.NO_MODIFICATION_ALLOWED_ERR:
					msg = 'The state of the underlying file system prevents any writing to a file or a directory.';
					break;
				case FileError.NOT_FOUND_ERR:
					msg = 'A required file or directory could not be found.';
					break;
				case FileError.NOT_READABLE_ERR:
					msg = 'The file or directory cannot be read, typically due to permission problems that occur after a reference to a file has been acquired.';
					break;
				case FileError.PATH_EXISTS_ERR:
					msg = 'The file or directory with the same path already exists.';
					break;
				case FileError.QUOTA_EXCEEDED_ERR:
					msg = "Either there's not enough remaining storage space or the storage quota was reached or the user declined to give more space to the database.";
					break;
				case FileError.SECURITY_ERR:
					msg = 'SECURITY_ERR ';
					break;
				case FileError.TYPE_MISMATCH_ERR:
					msg = 'The app looked up an entry,but the entry found is of the wrong type.For example, the app is asking for a directory, when the entry is really a file.';
					break;
				default:
					msg = 'Unknown Error ';
					break;
			};
			alert( msg + " " + e.code)
			console.log( msg + " " + e.code)
		}
	}

	function LoadMap( path ){
		MapImage = true;
		var img = new Image();
		$('map>viewport').css({
			'-webkit-transform': "matrix(1,0,0,1,0,0)",
		})
		$('map>viewport>img').attr({
			"src" : " ",
			"width" : "0",
			"height" : "0",
		}).css({
			'-webkit-transform': "matrix(1,0,0,1,0,0)",
		})
		//Remove Pogs
		$('viewport>pog').remove();

		img.src = path;
		img.onload = function(){
			var w = img.width, h = img.height, nw, nh;

			var r = $('map').height()/h, nw = r*w, nh = r*h;
			if( nw > $('map').width() ){
				r = $('map').width()/nw, nw = r*nw, nh = r*nh;
			}
			var x = ( $('map').width() / 2 )- (nw / 2 )
			var y = ( $('map').height() / 2 )- (nh / 2 );

			$('map>viewport>img').attr({
				"src" : img.src,
				"width" : nw,
				"height" : nh,
				"offset" : x+" "+y,
			}).css({
				"-webkit-transform": "matrix(1,0,0,1,"+x+","+y+")"
			});

			DrawDevicesOnMap();

			setTimeout(function() {

				// $(this).parents('panel.child').removeAttr("open").attr("right", "");
				// $(this).parents('panel.child').prev().removeAttr("left").attr("open", "");

				$('#MapsMasterPanel').removeAttr("open").attr("right", "");
				$('#DevicesOnMapPanel').removeAttr("left").attr("open", "");
				Spinner.hide();

			}, 10);
		}
	}

	function AddDeviceOnMap( x, y){
		DeviceAdd = true;

		OnMapFunctions.empty();
		OffMapFunctions.empty();

		var d = '';
		var offset = $('map').position();
		x -= parseFloat( offset.left);
		y -= parseFloat( offset.top );
		var matrix = $('map>viewport>img').css("-webkit-transform");
		matrix = matrix.substr(matrix.lastIndexOf("(")).replace(/\(|\)/g,"").split(", ");
		var top = matrix[5];
		var left = matrix[4];
		x -= left;
		y -= top;

		x = parseFloat( x ) / parseFloat( $('map>viewport>img').width()) * MAPWIDTH;
		y = parseFloat( y ) / parseFloat( $('map>viewport>img').height()) * MAPHEIGHT;

		var id;
		for (var i = 0; i < Devices.length; i++) {
			if( Devices[i].ID_Device == $('#ulFloat').attr("value") ){
				id = Devices[i].ID_Device;
				Devices[i].X = x;
				Devices[i].Y = y;
				Devices[i].ID_Map = CurrentMap.ID_Map;
				Devices[i].Image = "devimg/default.png";

				var s = CurrentGroup.ID_Group+",";
				s += CurrentMap.ID_Map+",";
				s += parseInt(x)+","+parseInt(y)+",";
				s += false+"";
				InsertChanges(Devices[i].ID_Device, s.toString());
			}
		};

		$('#MissingDevicesPanel').removeAttr("open").attr("right", "");
		// $('#DevicesOnMapPanel').removeAttr("left").attr("right", "");
		$('#informationPanel').removeAttr("left").attr("open", "");

		setTimeout(function() {
			// DrawAvalibleDevices();

			DrawDevicesOnMap();

			CurrentDevice = GetDevice( id );
			$.each($('map>viewport>pog'), function(index, item){
				if( $(item).attr("id") == CurrentDevice.ID_Device ){
					$(item).addClass("selecteddevice");
				}
			});

			DisplayDeviceInformation();

		}, 10);
	}

	function DrawDevicesOnMap(){
		ClearDevices();

		$('viewport>pog').remove();
		var d = '';

		var matrix = $('map>viewport>img').css("-webkit-transform");
		matrix = matrix.substr(matrix.lastIndexOf("(")).replace(/\(|\)/g,"").split(", ");
		var top = matrix[5];
		var left = matrix[4];

		for (var i = 0; i < Devices.length; i++) {
			if ( Devices[i].ID_Map == CurrentMap.ID_Map){

				var x = parseFloat( Devices[i].X) / MAPWIDTH * parseFloat( $('map>viewport>img').width() );
				var y = parseFloat( Devices[i].Y) / MAPHEIGHT * parseFloat( $('map>viewport>img').height() );

				var rot = "";
				if( y < 100 ){
					rot = "1,0,0,-1"
				}else if( x < 100){
					rot ="0,-1,-1,0"
				}else if(  x > MAPWIDTH - 100){
					rot = "0,-1,1,0"
				}else{
					rot ="1,0,0,1";
				}

				var style = "-webkit-transform: matrix("+rot+","+x+","+y+"); top:"+top+"; left:"+left+";";
				var c = Devices[i].Locked == true ? "locked" : "unlocked";
				console.log( c );

				d+="<pog style='"+style+"' class='"+c+"'id='"+Devices[i].ID_Device+"'></pog>";
			}
		};

		$('map>viewport').append(d);
	}

	function ResizeMap(){
		if( MapImage == true ){
			ClearDevices();

			$('map>viewport').css({
				'-webkit-transform': "matrix(1,0,0,1,0,0)",
			})
			$('map>viewport>img').css({
				'-webkit-transform': "matrix(1,0,0,1,0,0)",
			})
			var w = $('map>viewport>img').width(), h = $('map>viewport>img').height(), nw, nh;
			console.log( w +" "+ h);
			var r = $('map').height()/h; nh = r*h; nw = r* w;
			if( nw > $('map').width() ){
				r = $('map').width()/nw; nh = r*nh; nw = r* nw;
			}
			console.log( nh + " "+ nw);

			var x = ( $('map').width() / 2 )- (nw / 2 );
			var y = ( $('map').height() / 2 )- (nh / 2 );
			x = Math.round(x);
			y = Math.round(y);


			$('map>viewport>img').attr({
				"width" : nw,
				"height" : nh,
				"offset" : x+" "+y,
			}).css({
				"-webkit-transform": "matrix(1,0,0,1,"+x+","+y+")"
			});

			DrawDevicesOnMap();
		}
	}

	function orientationFix(e){
		var orientRotation = window.orientation;
		console.log( orientRotation );
		switch( orientRotation ){
			case 0:
				OrientPortrait();
			break;
			case 90:
				OrientLandscape();
			break;
			case 180:
				OrientPortrait();
			break;
			case 270:
				OrientLandscape();
			break;
		}

		function OrientPortrait(e){
			console.log("portrait");
			ResizeDeviceImage();
		}
		function OrientLandscape(e){
			console.log("landscape");
			ResizeDeviceImage();
		}
	}

	function ClearDevices(){
		$('viewport>pog').remove();
	}
	function ClearMap(){
		MapImage = false;
		$('map>viewport').css({
			'-webkit-transform': "matrix(1,0,0,1,0,0)",
		})
		$('map>viewport>img').attr({
			"src" : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
			"width" : "0",
			"height" : "0",
		}).css({
			'-webkit-transform': "matrix(1,0,0,1,0,0)",
		})
	}

	var GroupTree = {
		MoveForward: function( id ){
			if( $('#GroupsMasterGroup').children().length == 0){
				console.log("Create Root");
				GroupTree.RootGroup();
			}else{
				var exists = false; var element = null;
				$.each($('#GroupsMasterGroup>panel.group').children(), function(index, item){
					if( $(item).attr("child") == id ){
						exists = true ;
						element = $(item);
					}
				});
				if( exists == false ){
					console.log("Create SubGroup");
					GroupTree.CreateSubGroup(id);
				}else{
					setTimeout(function() {
						$('#GroupsMasterGroup>panel.group').children('[open]').removeAttr("open").attr("left", "");
						element.removeAttr("right").attr("open", "");
						$('#GroupsMasterGroup').parent().next().removeAttr("novis");
						Spinner.hide();
					}, 10);
				}
			}
		},
		RootGroup: function(e){
			$('#GroupsMasterGroup').empty()
			var s = "";
			s+= "<panel class='group'>";

			var root = Groups[0];
			var kids = "hasKids";
			if(GroupTree.CheckForChildren( root ) == 0){
					kids+=" hide"
			}

			s+= "<panel open class='child' root><scroll class='y'><row class='content'>";
			s+= "<row class='item' groupid='"+root.ID_Group+"' fullpath='"+root.FullPath+"' groupPath='"+root.GroupPath+"'' ><span><name>"+root.ID_Group+" - "+root.Name+"</name></span><a class='button "+kids+" ' href='#'></a><a class='button isselected' href='#'></a></row>";
			s+= "</row></scroll></panel></panel>";

			$('#GroupsMasterGroup').append(s);
			$('#GroupsMasterGroup').parent().next().attr("novis", "");
			Spinner.hide();
		},
		CreateSubGroup: function( id ){
			var rootElem = $('#GroupsMasterGroup>panel.group');
			var s = "";
			s+= "<panel right class='child' child='"+id+"' ><scroll class='y'><row class='content'>";

			var children = new Array();
			var groupClone = Groups.slice(0);

			for (var i = 1; i < groupClone.length; i++) {
				if( groupClone[i].FullPath == id+""+groupClone[i].ID_Group+"."){
					children.push( groupClone[i] );
				}
			};

			for (var i = 0; i < children.length; i++) {

				var kids = "haskids";
				if(GroupTree.CheckForChildren( children[i] ) == 0){
					kids+=" hide"
				}

				s+= "<row class='item' groupid='"+children[i].ID_Group+"' fullpath='"+children[i].FullPath+"' groupPath='"+children[i].GroupPath+"'' ><span><name>"+children[i].ID_Group+" - "+children[i].Name+"</name></span><a class='button "+kids+" ' href='#'></a><a class='button isselected' href='#'></a></row>";
			};

			s += "</row></scroll></panel>";
			$(rootElem).append(s);
			setTimeout(function() {
				$(rootElem).children("[open]").removeAttr("open").attr("left", "");
				$(rootElem).children(":last-child").removeAttr("right").attr("open", "");
				$('#GroupsMasterGroup').parent().next().removeAttr("novis")
				Spinner.hide();
			}, 10);
		},
		CheckForChildren: function( item ){
			var childrenNumber = 0;
			var groupClone = Groups.slice(0);
			for (var i = 0; i < groupClone.length; i++) {
				if( groupClone[i].GroupPath == item.GroupPath + "."+item.ID_Group){
					childrenNumber++;
				}
			};
			return childrenNumber;
		}
	}

	var OnMapFunctions = {
		current: 0,
		RootGroup: function(){
			$('#DevicesonMapGroup').empty();
			var s = "";
			s += "<panel class='group'>";
			s += "<panel open class='child '><scroll class='y'><row class='content'>"

			for (var j = 0; j < OnMapDevices[0].length; j++) {
				var id = OnMapDevices[0][j].ID_Device, desc = OnMapDevices[0][j].Description, serial = OnMapDevices[0][j].SerialNumber;
				if( desc.length == 0) desc = "No Description";
				if( serial.length == 0) serial = "No Serial Number";
				s += "<row class='button item mDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
			};

			s +="</row></scroll></panel>"
			s += "</panel>";

			s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
				'<row class="back">'+
				'<a href="#" class="button backward" id="btnBackwards_On"></a><indicator>0</indicator><a href="#" class="button forward" id="btnforwards_On"></a>'+
				'</row></row>';

			$('#DevicesonMapGroup').empty().append(s);
			s.length = 0;
			OnMapFunctions.current = 0;
			Spinner.hide();
		},
		NextGroup: function(){
			var s = "";
			s += "<panel right class='child '><scroll class='y'><row class='content'>"
			console.log( OnMapFunctions.current );
			for (var j = 0; j < OnMapFunctions[OnMapFunctions.current].length; j++) {
				var id = OnMapFunctions[OnMapFunctions.current][j].ID_Device, desc = OnMapFunctions[OnMapFunctions.current][j].Description, serial = OnMapFunctions[OnMapFunctions.current][j].SerialNumber;
				if( desc.length == 0) desc = "No Description";
				if( serial.length == 0) serial = "No Serial Number";
				s += "<row class='button item mDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
			};

			s +="</row></scroll></panel>"
			$('#DevicesonMapGroup>panel.group').append(s);
			$('#DevicesonMapGroup>panel.group>panel.child').attr("left", "").removeAttr("open").removeAttr("right");
			$('#DevicesonMapGroup>panel.group>panel.child:last-child').attr("open", "").removeAttr("left").removeAttr("right");
			setTimeout(function() {
				$('#DevicesonMapGroup>panel.group>panel.child:first-child').remove();
			}, 700);
			s.length = 0;
			Spinner.hide();
		},
		PrevGroup: function(){

			var s = "";
			s += "<panel left class='child '><scroll class='y'><row class='content'>"
			console.log( OnMapFunctions.current );
			for (var j = 0; j < OnMapFunctions[OnMapFunctions.current].length; j++) {
				var id = OnMapFunctions[OnMapFunctions.current][j].ID_Device, desc = OnMapFunctions[OnMapFunctions.current][j].Description, serial = OnMapFunctions[OnMapFunctions.current][j].SerialNumber;
				if( desc.length == 0) desc = "No Description";
				if( serial.length == 0) serial = "No Serial Number";
				s += "<row class='button item mDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
			};

			s +="</row></scroll></panel>"
			$('#DevicesonMapGroup>panel.group').append(s);
			$('#DevicesonMapGroup>panel.group>panel.child').attr("right", "").removeAttr("open").removeAttr("left");
			$('#DevicesonMapGroup>panel.group>panel.child:last-child').attr("open", "").removeAttr("left").removeAttr("right");
			setTimeout(function() {
				$('#DevicesonMapGroup>panel.group>panel.child:first-child').remove();
			}, 700);
			s.length = 0;
			Spinner.hide();
		},
		empty:function(){
			OnMapFunctions.current = -1;
			var s = "";
				s += "<row class='item none' id='none'><span><name>No Devices</name><serial>This map has no devices</serial></span></row>";
			console.log("Drawing");
			$('#DevicesonMapGroup').empty().append(s);
			s.length = 0;
			Spinner.hide();
		},
		MoveForward: function(){
			if( OnMapDevices.length > 0){
				if( OnMapFunctions.current == -1){
					Spinner.hide();
					Spinner.show();
					OnMapFunctions.RootGroup();
				}else{
					OnMapFunctions.current++;
					if( OnMapFunctions.current < (OnMapDevices.length)){
						Spinner.hide();
						Spinner.show();
						OnMapFunctions.NextGroup();
						$('a.button#btnforwards_On').prev('indicator').html( OffMapFunctions.current );
					}else{
						OnMapFunctions.current--;
					}
				}
			}else{
				OnMapFunctions.empty();
			}
		},
		MoveBackward: function(){
			OnMapFunctions.curernt--;
			if( OnMapFunctions.current < 0){
				OnMapFunctions.current = 0;
			}else{
				Spinner.hide();
				Spinner.show();
				OnMapFunctions.PrevGroup();
				$('a.button#btnforwards_On').prev('indicator').html( OffMapFunctions.current );
			}
		}
	}
	var OffMapFunctions = {
		current: 0,
		RootGroup: function(){
			var s = "";
			s += "<panel class='group'>";
			s += "<panel open class='child '><scroll class='y'><row class='content'>"

			for (var j = 0; j < OffMapDevices[0].length; j++) {
				var id = OffMapDevices[0][j].ID_Device, desc = OffMapDevices[0][j].Description, serial = OffMapDevices[0][j].SerialNumber;
				if( desc.length == 0) desc = "No Description";
				if( serial.length == 0) serial = "No Serial Number";
				s += "<row class='button item uDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
			};

			s +="</row></scroll></panel>"
			s += "</panel>";

			s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
				'<row class="back">'+
				'<a href="#" class="button backward" id="btnBackwards_Off"></a><indicator>0</indicator><a href="#" class="button forward" id="btnforwards_Off"></a>'+
				'</row></row>';

			$('#MissingDevicesGroups').empty().append(s);
			s.length = 0;
			OffMapFunctions.current = 0;
			Spinner.hide();
		},
		NextGroup: function(){
			var s = "";
			s += "<panel right class='child '><scroll class='y'><row class='content'>"
			console.log( OffMapFunctions.current );
			for (var j = 0; j < OffMapDevices[OffMapFunctions.current].length; j++) {
				var id = OffMapDevices[OffMapFunctions.current][j].ID_Device, desc = OffMapDevices[OffMapFunctions.current][j].Description, serial = OffMapDevices[OffMapFunctions.current][j].SerialNumber;
				if( desc.length == 0) desc = "No Description";
				if( serial.length == 0) serial = "No Serial Number";
				s += "<row class='button item uDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
			};

			s +="</row></scroll></panel>"
			$('#MissingDevicesGroups>panel.group').append(s);
			$('#MissingDevicesGroups>panel.group>panel.child').attr("left", "").removeAttr("open").removeAttr("right");
			$('#MissingDevicesGroups>panel.group>panel.child:last-child').attr("open", "").removeAttr("left").removeAttr("right");
			setTimeout(function() {
				$('#MissingDevicesGroups>panel.group>panel.child:first-child').remove();
			}, 700);
			s.length = 0;
			Spinner.hide();
		},
		PrevGroup: function(){
			var s = "";
			s += "<panel left class='child '><scroll class='y'><row class='content'>"
			console.log( OffMapFunctions.current );
			for (var j = 0; j < OffMapDevices[OffMapFunctions.current].length; j++) {
				var id = OffMapDevices[OffMapFunctions.current][j].ID_Device, desc = OffMapDevices[OffMapFunctions.current][j].Description, serial = OffMapDevices[OffMapFunctions.current][j].SerialNumber;
				if( desc.length == 0) desc = "No Description";
				if( serial.length == 0) serial = "No Serial Number";
				s += "<row class='button item uDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
			};

			s +="</row></scroll></panel>"
			$('#MissingDevicesGroups>panel.group').append(s);
			$('#MissingDevicesGroups>panel.group>panel.child').attr("right", "").removeAttr("open").removeAttr("left");
			$('#MissingDevicesGroups>panel.group>panel.child:last-child').attr("open", "").removeAttr("left").removeAttr("right");
			setTimeout(function() {
				$('#MissingDevicesGroups>panel.group>panel.child:first-child').remove();
			}, 700);
			s.length = 0;
			Spinner.hide();
		},
		empty:function(){
			OffMapFunctions.current = -1;
			var s = "";
			s += "<row class='item none' id='none'><span><name>No Devices</name><serial>This map has no devices</serial></span></row>";
			$('#MissingDevicesGroups').empty().append(s);
			s.length = 0;
			Spinner.hide();
		},
		MoveForward: function(){

			if( OffMapDevices.length > 0){
				if( OffMapFunctions.current == -1){
					Spinner.hide();
					Spinner.show();
					OffMapFunctions.RootGroup();
				}else{
					OffMapFunctions.current++;
					if( OffMapFunctions.current < (OffMapDevices.length)){
						Spinner.hide();
						Spinner.show();
						OffMapFunctions.NextGroup();
						$('a.button#btnforwards_Off').prev('indicator').html( OffMapFunctions.current );

					}else{
						OffMapFunctions.current--;
					}
				}
			}else{
				OffMapFunctions.empty();
			}
		},
		MoveBackward: function(){
			OffMapFunctions.current--;
			if( OffMapFunctions.current < 0 ){
				OffMapFunctions.current = 0;
			}else{
				Spinner.hide();
				Spinner.show();
				OffMapFunctions.PrevGroup();
				$('a.button#btnforwards_Off').prev('indicator').html( OffMapFunctions.current );
			}
		}
	}

	function DrawChangesLog( data ){
		var today = GetToday();
		var s = "";

		s+= '<dropdown class="master expand"><dropdown class="head"><p>'+ today +'</p><a href="#" class="button"></a></dropdown><dropdown class="content">';

		for (var i = 0; i < data.length; i++) {
			//REMEMBER TO GET THE SERIAL NUMBER OF THE DEVICE
			if( data[i].ID == null)data[i].ID = "Unknown Device";
			s += '<dropdown class="master expand"><dropdown class="head"><p>'+ data[i].ID +'</p><a href="#" class="button"></a></dropdown><dropdown class="content">';
			for (var n = 0; n < data[i].Tasks.length; n++) {
				console.log("");
				s += '<row class="item"><p>'+data[i].Tasks[n].Type+'</p><p>'+data[i].Tasks[n].Value+'</p></row>'
			};
			s+="</dropdown></dropdown>";
		};

		s+='</dropdown></dropdown>';

		$('#logbookLog').prepend(s);
	}

	function SplitIntoGroups( SplitArray ){
		var clone = SplitArray.slice(0), group = new Array(), returnArray = new Array();
		while( clone.length > 0){
			group.push( clone[0] );

			if( group.length == SAFEDEVICES ){
				returnArray.push( group );
				group = new Array();
			}
			clone.splice(0,1);
		}
		if( group.length != 0){
			returnArray.push( group );
			group = new Array();
		}
		return returnArray;
	}

	function DrawAvalibleMaps(){
		$('#infoMapNum').val("Number of Maps : " + Maps.length );

		if( Maps.length > 0 ){
			var MapsClone = Maps.slice(0);
			MapsClone = SplitIntoGroups( MapsClone );
			var s = "";
			s+="<panel class='group'>"
			for (var i = 0; i < MapsClone.length; i++) {
				s += "<panel right class='child'><scroll class='y'><row class='content'>"
				for (var j = 0; j < MapsClone[i].length; j++) {
					var name = MapsClone[i][j].Name;
					var desc = MapsClone[i][j].Description;
					var id = MapsClone[i][j].ID_Map;
					if( name.length == 0 || name == null) name = "Name unavalible";
					if( desc.length == 0) desc = "No description";
					s += "<row class='button item map' id='"+id+"'><span><name>"+name+"</name><serial>"+desc+"</serial></span></row>";
				};
				s += "</row></scroll></panel>";
			};
			s+="</panel>"
			if( MapsClone.length > 1 ){
				s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
					'<row class="back">'+
					'<a href="#" class="button backward" id="btnBackwards"></a><indicator>1</indicator><a href="#" class="button forward" id="btnforwards"></a>'+
					'</row></row>';
			}
			$('#MapsMasterGroup').empty().append(s);
			$('#MapsMasterGroup>panel.group').children().hide();
			setTimeout(function() {
				$('#MapsMasterGroup>panel.group>panel:first-child').attr("open", "").removeAttr("left").removeAttr("right").show();
			}, 1);
			s.length = 0;
		}else{
			var s = "";
			s += "<row class='item none' id='none'><span><name>No Maps</name><serial>This group contains no maps</serial></span></row>";
			console.log("Drawing");
			$('#MapsMasterGroup').empty().append(s);
			s.length = 0;
		}
	}

//Split draw Avalible devices into 2 functions
// Draw mapped devices - should be quick
//draw missing devices - will take a while;
	function LoadOnMapDevices(){
		var s = "";
		s += "<row class='item none' id='none'><span><name>Loading Devices</name><serial>This may take some time.</serial></span></row>";
		console.log("Drawing");
		$('#DevicesonMapGroup').empty().append(s);
		s.length = 0;
	}


	function LoadOffMapDevices(){
		var s = "";
		s += "<row class='item none' id='none'><span><name>Loading Devices..</name><serial>This may take some time.</serial></span></row>";
		$('#MissingDevicesGroups').empty().append(s);
		s.length = 0;
	}
	/*function DrawOnMapDevices(){
		Spinner.show();
		OnMapDevices.length = 0;

		for (var i = 0; i < Devices.length; i++) {
			if( Devices[i].ID_Map == CurrentMap.ID_Map )
				OnMapDevices.push( Devices[i] );
		};

		if( OnMapDevices.length>0){
			OnMapDevices = SplitIntoGroups( OnMapDevices );

				var s = "";
				s+="<panel class='group'>"
				for (var i = 0; i < OnMapDevices.length; i++) {
					s += "<panel right class='child'><scroll class='y'><row class='content'>"
					for (var j = 0; j < OnMapDevices[i].length; j++) {
						var id = OnMapDevices[i][j].ID_Device, desc = OnMapDevices[i][j].Description, serial = OnMapDevices[i][j].SerialNumber;
						if( desc.length == 0) desc = "No Description";
						if( serial.length == 0) serial = "No Serial Number";
						s += "<row class='button item mDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";

					};
					s +="</row></scroll></panel>";
				};
				s+="</panel>";
				if( OnMapDevices.lenght > 1 ){
					s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
						'<row class="back">'+
						'<a href="#" class="button backward" id="btnBackwards"></a><a href="#" class="button forward" id="btnforwards"></a>'+
						'</row></row>';
				}

				console.log("Drawing");
				$('#DevicesonMapGroup').empty().append(s);
				setTimeout(function() {
					$('#DevicesonMapGroup>panel.group>panel:first-child').attr("open", "").removeAttr("left").removeAttr("right");
				}, 1);
				s.length = 0;
			Spinner.hide();
		}else{
			var s = "";
			s += "<row class='item none' id='none'><span><name>No Devices</name><serial>This map has no devices</serial></span></row>";
			console.log("Drawing");
			$('#DevicesonMapGroup').empty().append(s);
			s.length = 0;
			Spinner.hide();
		}
	}*/
	/*function DrawOffMapDevices(){
		OffMapDevices.length = 0;
		for (var i = 0; i < Devices.length; i++) {
			if( Devices[i].ID_Map == 0 )
				OffMapDevices.push( Devices[i] );
		};

		if( OffMapDevices.length>0){
			OffMapDevices = SplitIntoGroups( OffMapDevices );

				var s = "";
				s += "<panel class='group'>";
				for (var i = 0; i < OffMapDevices.length; i++) {
					s += "<panel right class='child '><scroll class='y'><row class='content'>"
					for (var j = 0; j < OffMapDevices[i].length; j++) {
						var id = OffMapDevices[i][j].ID_Device, desc = OffMapDevices[i][j].Description, serial = OffMapDevices[i][j].SerialNumber;
						if( desc.length == 0) desc = "No Description";
						if( serial.length == 0) serial = "No Serial Number";
						s += "<row class='button item uDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
					};
					s +="</row></scroll></panel>"
				};
				s += "</panel>";
				if( OffMapDevices.length > 1){
					s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
						'<row class="back">'+
						'<a href="#" class="button backward" id="btnBackwards"></a><a href="#" class="button forward" id="btnforwards"></a>'+
						'</row></row>';
				}

				console.log("Drawing");
				$('#MissingDevicesGroups').empty().append(s);
				setTimeout(function() {
					$('#MissingDevicesGroups>panel.group>panel:first-child').attr("open", "").removeAttr("left").removeAttr("right");
				}, 1);
				s.length = 0;

			Spinner.hide();
		}else{
			var s = "";
			s += "<row class='item none' id='none'><span><name>No Devices</name><serial>This group has no missing devices</serial></span></row>";
			console.log("Drawing");
			$('#MissingDevicesGroups').empty().append(s);
			s.length = 0;
			Spinner.hide();
		}
	}*/





	function DrawAvalibleDevices(){
		alert("What are you doing? this takes way too long, remove it, but remember what you pressed to get here")
/*		$('#infoDeviceNum').val("Number of Devices : " + Devices.length );
		var OnMap = new Array(); OffMap = new Array();

		for (var i = 0; i < Devices.length; i++) {
			if( Devices[i].ID_Map == CurrentMap.ID_Map){
				OnMap.push( Devices[i] );
			}
			if( Devices[i].ID_Map == 0 ){
				OffMap.push( Devices[i] );
			}
		};

		if( OnMap.length > 0 ){
			OnMap = SplitIntoGroups( OnMap );
			var s = "";
			s+="<panel class='group'>"
			for (var i = 0; i < OnMap.length; i++) {
				s += "<panel right class='child'><scroll class='y'><row class='content'>"
				for (var j = 0; j < OnMap[i].length; j++) {
					var id = OnMap[i][j].ID_Device, desc = OnMap[i][j].Description, serial = OnMap[i][j].SerialNumber;
					if( desc.length == 0) desc = "No Description";
					if( serial.length == 0) serial = "No Serial Number";
					s += "<row class='button item mDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";

				};
				s +="</row></scroll></panel>";
			};
			s+="</panel>";
			if( OnMap.lenght > 1 ){
				s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
					'<row class="back">'+
					'<a href="#" class="button backward" id="btnBackwards"></a><a href="#" class="button forward" id="btnforwards"></a>'+
					'</row></row>';
			}

			console.log("Drawing");
			$('#DevicesonMapGroup').empty().append(s);
			setTimeout(function() {
				$('#DevicesonMapGroup>panel.group>panel:first-child').attr("open", "").removeAttr("left").removeAttr("right");
			}, 1);
			s.length = 0;
		}else{
			var s = "";
			s += "<row class='item none' id='none'><span><name>No Devices</name><serial>This map has no devices</serial></span></row>";
			console.log("Drawing");
			$('#DevicesonMapGroup').empty().append(s);
			s.length = 0;
		}

		if( OffMap.length > 0 ){
			OffMap = SplitIntoGroups( OffMap );
			var s = "";
			console.log("Need to create : " + OffMap.length + " panels")

			s += "<panel class='group'>";
			for (var i = 0; i < OffMap.length; i++) {
				s += "<panel right class='child '><scroll class='y'><row class='content'>"
				for (var j = 0; j < OffMap[i].length; j++) {
					var id = OffMap[i][j].ID_Device, desc = OffMap[i][j].Description, serial = OffMap[i][j].SerialNumber;
					if( desc.length == 0) desc = "No Description";
					if( serial.length == 0) serial = "No Serial Number";
					s += "<row class='button item uDevice' id='"+id+"'><span><name>"+desc+"</name><serial>"+serial+"</serial></span></row>";
				};
				s +="</row></scroll></panel>"
			};
			s += "</panel>";
			if( OffMap.length > 1){
				s += '<row class="master" style="-webkit-box-flex: 1; min-height: 40px;max-height: 40px;">'+
					'<row class="back">'+
					'<a href="#" class="button backward" id="btnBackwards"></a><a href="#" class="button forward" id="btnforwards"></a>'+
					'</row></row>';
			}

			console.log("Drawing");
			$('#MissingDevicesGroups').empty().append(s);
			setTimeout(function() {
				$('#MissingDevicesGroups>panel.group>panel:first-child').attr("open", "").removeAttr("left").removeAttr("right");
			}, 1);
			s.length = 0;
		}else{
			var s = "";
			s += "<row class='item none' id='none'><span><name>No Devices</name><serial>This group has no missing devices</serial></span></row>";
			console.log("Drawing");
			$('#MissingDevicesGroups').empty().append(s);
			s.length = 0;
		}*/
	}

	function DrawTotalDevices(){
		$('#infoDeviceNum').val("Number of Devices : " + Devices.length );
	}

	function DrawDate(){
		var s = Settings.lastUpdate.replace(/\"/g," ");
		if( s.length > 0)
			$('#infoDownloadDate').val(s);
		else
			$('#infoDownloadDate').val('Unknown Date');
	}
	function DrawTitle(){
		if( CurrentMap.Description )
			$('#MapTitle').empty().html( CurrentMap.Name /*+" - "+ CurrentMap.Description*/);
		else
			$('#MapTitle').empty().html("OneStop");
	}

//File transfer Download map and DeviceImage from the server
	var Download = {
	// Downlaods the map from the Path + map Name
		map: function( map, path){
			var ft = new FileTransfer();
			var uri = encodeURI( URL + "/Maps/" + map)
			var target = path + "/" + map;
			ft.download(uri, target,
				function(entry) {
					ReadFile.maps();
					Spinner.hide();
				},
				function( e ){
					switch (e.code){
						case FileTransferError.FILE_NOT_FOUND_ERR:
							AddMessage("Cannot find Map Image", "long", "bottom");
							setTimeout(function() {
								ReadFile.forceMissingMap( );
							}, 1000);

						break;
						case FileTransferError.INVALID_URL_ERR:
							alert( "Server URL is incorrect." );
						break;
						case FileTransferError.CONNECTION_ERR:
							AddMessage("Cannot find connection path for Map Image", "long", "bottom");
							setTimeout(function() {
								ReadFile.forceMissingMap( );
							}, 1000);

						break;
						case FileTransferError.ABORT_ERR:
							msg += "Process was aborted."
							Spinner.hide();
						break;
					}
				},
				true,
				{
					headers:
					{
						"Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
					}
				}
			);
		},
		// downlaods the Device image from the server,
		// If the image canot be found then it will fall back to the default.png image, which is the BITS Logo
		devimg: function(img, path ){
			var ft = new FileTransfer();
			var uri = encodeURI( URL + "/devimg/" + img)
			var target = path + "/" + img;
			ft.download(uri, target,
				function(entry) {
					var path = entry.toURL();
					DeviceImage.loadImage( path )
				},
				Download.error,
				true,
				{
					headers:
					{
						"Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
					}
				}
			);
		},
		error: function(e){
			var msg = '';
			switch (e.code){
				case FileTransferError.FILE_NOT_FOUND_ERR:
					msg += "File cannot be found."
				break;
				case FileTransferError.INVALID_URL_ERR:
					msg += "Server URL is incorrect."
				break;
				case FileTransferError.CONNECTION_ERR:
					// msg += "Connection timed out or was disconnected."
					msg += "Cannot find connection path for Image download"
				break;
				case FileTransferError.ABORT_ERR:
					msg += "Process was aborted."
				break;
			}

			alert(msg)

			Spinner.hide();
		}
	}

	var touchEvent = {
		state: 'none',
		alpha: {
			x: 0,
			y: 0,
		},
		delta: {
			x: 0,
			y: 0,
		},
		target: {
			start: 'none',
			end: 'none',
		},
		zoom: MINZOOM,
		startDist: 0,
		distance: 0,
		toPage: function ( touch ){
			var t = {
				/*x: touch.pageX / touchEvent.zoom,*/
				/*x: touch.pageX * zoomEvent.zoom,*/
				x: touch.pageX,
				/*y: touch.pageY / touchEvent.zoom*/
				/*y: touch.pageY * zoomEvent.zoom*/
				y: touch.pageY
			}

			return t;
		},
		toPageOffset: function ( touch ){
		}
	}

	var zoomEvent = {
		startDist: 0,
		startX: 0,
		startY: 0,
		dist: 0,
		endDist: 0,
		zoom: MINZOOM,
	}

	var PhoneGap = {
		ready: function( event ){
			Connection.online = true;
			Connection.status = "online";

			Shadow.hide();
			ResetDeviceInformation();
			DrawAvalibleMaps()
			DrawTotalDevices();

			OnMapFunctions.empty();
			OffMapFunctions.empty();


			// DrawOnMapDevices();
			// DrawOffMapDevices();
			DrawDate()
			DrawTitle()

			if( ThisDevice.Browser == true){
				Connection.type = "WiFi";
			}else{
				Connection.type = navigator.connection.type;
			}

			// $("#btnBin").parents('row.master').attr("novis", "");
			$('#deleteoptions').attr("novis", "");
			$('#deleteoptions').prev().removeAttr("novis");

			if( LAZY ){
				$('#inputUsername').val( "craig" );
				$('#inputPassword').val( "password" );
			}
			ReadFile.settings();
		},
		back: function( event ){
			if( $('#login').hasClass("visible")){
				navigator.app.exitApp();
			}
			else{
				NotifyConfirm(
					"Do you want exit the app?",
					function( buttonIndex ){
						if( buttonIndex == 1){
						 navigator.app.exitApp();
						}
					},
					"Exit App",
					["Exit","Cancel"]
				);
			}
		},
		pause: function( event ){
			navigator.splashscreen.hide();
		},
		resume: function( event ){
			navigator.splashscreen.hide();
		},
		online: function( event ){
			Connection.online = true;
			Connection.status = "online";
			Connection.type = navigator.connection.type;
			AddMessage("Device online", "short", "bottom");
			$('#NetStatus').addClass("online").removeClass("offline");
			if( Settings.logged == true  && Settings.changes == 1){
				NotifyConfirm(
					"Changes have been detected",
					function( buttonIndex ){
						if( buttonIndex == 1 ){
							ReadFile.changes();
							Spinner.show();
							setTimeout(function() {
								Ajax.changes();
							}, 250);
						}
						if( buttonIndex == 2 )
{							Changes.length = 0;
							RemoveFile.changes();
							$('#btnDownload').trigger("tap");
						}
					},
					"Changes detected",
					["Upload", "Ignore"]
				);
			}
		},
		offline: function( event ){
			Connection.online = false;
			Connection.status = "offline"
			Connection.type = navigator.connection.type;
			AddMessage("Device offline", "short", "bottom");
		}
	}

	function GetConnection(){
		return Connection.online;
	}

	function ChangeInformation( result, attribute ){
		for (var i = 0; i < Devices.length; i++) {
			if( Devices[i].ID_Device == CurrentDevice.ID_Device){
				if( attribute == "locked"){
					Devices[i].Locked = result;
					$.each($('map>viewport>pog'), function(index, item){
						if( $(item).attr("id") == Devices[i].ID_Device ){
							$(item).toggleClass("unlocked").toggleClass("locked");
						}
					});
					AddChanges( CurrentDevice.ID_Device, 'lock', result );
					// Map.removeDevices();
					// Map.drawDevices();

					CurrentDevice = Devices[i];
					// DrawAvalibleDevices();
					// DisplayDeviceInformation();
					DeviceChange = true;
				}

				if( attribute == "description") {
					Devices[i].Description = result;
					AddChanges( CurrentDevice.ID_Device, 'description', result );
					$('#infoDeviceDescription').val( CurrentDevice.Description );

					CurrentDevice = Devices[i];
					// DrawAvalibleDevices();
					DisplayDeviceInformation();
					DeviceChange = true;
				}

				if( attribute == "location"){
					Devices[i].Location = result;
					AddChanges( CurrentDevice.ID_Device, 'location', result );
					$('#infoDeviceLocation').val( CurrentDevice.Location );

					CurrentDevice = Devices[i];
					// DrawAvalibleDevices();
					DisplayDeviceInformation();
					DeviceChange = true;
				}

				if( attribute == "serialnumber"){
					Devices[i].SerialNumber = result;
					AddChanges( CurrentDevice.ID_Device, 'serialnumber', result );
					$('#infoDeviceSerialNumber').val( CurrentDevice.SerialNumber );

					CurrentDevice = Devices[i];
					// DrawAvalibleDevices();
					DisplayDeviceInformation();
					DeviceChange = true;
				}

				// DisplayDeviceInformation();
			}
		};
	}

	function RemoveManager( flag, timer ){
		if(timer == null) timer = 1200;
		if(flag){
			RemoveMessages = setInterval(
				function(){
					if( $('messageHolder').children().length > 0){
						console.log("Removing Message");
						$('messageHolder').children().first().remove();
					}else{
						RemoveManager( false );
					}
				}, timer);
		}else{
			console.log("Stopping message removeal");
			clearInterval( RemoveMessages );
			RemoveMessages = null;
		}
	}

	function AddManager(flag){
		if(flag){
			AddMessages = setInterval(
				function(){
					if( MessageArray.length > 0 ){
						console.log("Adding Message");
						$('messageHolder').append( MessageArray[0] );
						setTimeout(function() {
							// $('messageHolder').children().last().addClass("visible");
							MessageArray.splice(0, 1);
						},1);

						if(RemoveMessages == null){
							RemoveManager( true );
						}

					}else{
						AddManager(false);
					}
				}, 210);
		}else{
			console.log("Stopping message addition");
			clearInterval( AddMessages );
			AddMessages = null;
		}
	}

	function AddMessage( msg, duration, position){
		window.plugins.toast.show( msg, duration, position, function(a){
			console.log("Toast success " + a);
		}, function(a){
			alert("Toast Error" + a);
		})


	}

	function ChangeGroup( num ){
		try{
			ClearMap();
			ClearDevices();
			ResizeMap();

			CurrentMap.length = 0;
			CurrentDevice = 0;
			Maps.length = 0;
			Devices.length = 0;

			OnMapDevices.length = 0;
			OffMapDevices.length = 0;

			OnMapFunctions.empty();
			OffMapFunctions.empty();

			// DrawAvalibleDevices();

			// DrawOnMapDevices();
			// DrawOffMapDevices();

			Delete.length = 0;

			// DrawTitle()
			$('li.button.remove').removeClass("remove");
			$('#btnBinSelected').html(Delete.length+" selected");
			$('#deleteoptions').attr("novis", "");
			$('#deleteoptions').prev().removeAttr("novis");
			CurrentGroup = Groups[ num ];
			console.log( CurrentGroup);

			$('#inputselectGroup').val( CurrentGroup.ID_Group+" - "+CurrentGroup.Name );

			Spinner.show();
			ReadFile.data();

		}catch(e){
			alert("trying changeGroup with num " + num + " error: " + e.toString());
		}

	}

	function ResetDeviceInformation(event){
		$('#imageDevice').css("background-image", "url(./img/icon.png)")
		$('#infoDevicePosition').val("");
		$('#infoDeviceDescription').val("");
		$('#infoDeviceLocation').val("");
		$('#infoDeviceSerialNumber').val("");
		$('#infoDeviceLock').prop("checked", 0);

	}

	function DisplayDeviceInformation( event ){
		DeviceImage.ClearImage();

		$('#infoDevicePosition').val( CurrentDevice.X.toFixed(0) +" : "+ CurrentDevice.Y.toFixed(0) );
		$('#infoDeviceDescription').val( CurrentDevice.Description );

		if( CurrentDevice.Location == "" || CurrentDevice.Location == null){
			$('#infoDeviceLocation').val( "No Location" );
		}else{
			$('#infoDeviceLocation').val( CurrentDevice.Location );
		}
		if( CurrentDevice.SerialNumber == '' || CurrentDevice.SerialNumber == null){
			$('#infoDeviceSerialNumber').val( "No Serial" );
		}else{
			$('#infoDeviceSerialNumber').val( CurrentDevice.SerialNumber);
		}

		if( CurrentDevice.Locked == true ){
			//Remember to update devices on the map view
			$('#infoDeviceLock').prop("checked", 1);

		}else{
			$('#infoDeviceLock').prop("checked", 0);
		}
	}

	function AddChanges( ID, attribute, value ){
		var task = {"Type":"save", "Attribute":attribute, "Value":value};

		if( Changes.length > 0){
			var exists = false;
			for (var i = 0; i < Changes.length; i++) {
				if( Changes[i].ID == ID ){
					exists = true;
					Changes[i].Tasks.push( task );
				}
			};

			if( exists == false) {
				console.log(ID + "Add to End");
				Changes.push({"ID":ID, "Tasks":[]});
				Changes[Changes.length-1].Tasks.push( task );
			}
		}else{
			Changes.push({"ID":ID, "Tasks":[]});
			Changes[Changes.length-1].Tasks.push( task );
		}
	}

	function InsertChanges( ID, value ){
		var task = {"Type": "insert", "Value":value};

		if( Changes.length > 0){
			var exists = false;
			for (var i = 0; i < Changes.length; i++) {
				if( Changes[i].ID == ID ){
					exists = true;
					Changes[i].Tasks.push( task );
				}
			};
			if( exists == false ){
				Changes.push({"ID":ID, "Tasks":[]});
				Changes[Changes.length-1].Tasks.push( task );
			}
		}else{
			Changes.push({"ID":ID, "Tasks":[]});
			Changes[Changes.length-1].Tasks.push( task );
		}
	}

	function RemoveChanges( ID ){
		var task = {"Type": "remove", "Attribute":null, "Value": null};

		if( Changes.length > 0){
			var exists = false;
			for (var i = 0; i < Changes.length; i++) {
				if( Changes[i].ID == ID ){
					exists = true;
					Changes[i].Tasks.push( task );
				}
			};
			if( exists == false ){
				Changes.push({"ID":ID, "Tasks":[]});
				Changes[Changes.length-1].Tasks.push( task );
			}
		}else{
			Changes.push({"ID":ID, "Tasks":[]});
			Changes[Changes.length-1].Tasks.push( task );
		}
	}

	function GetDevice( id ){
		for (var i = 0; i < Devices.length; i++) {
			if( Devices[i].ID_Device == id){
				return Devices[i];
			}
		};
	}
	function GetDistance( a, b){
		return Math.sqrt(( a.x - b.x ) * ( a.x - b.x ) + ( a.y - b.y ) * (a.y - b.y ));
	}
	//returns todays date in UTC
	function GetToday(){
		var d = new Date();
		return d.toUTCString();
	}
	//Converts object into a stringed version adn reutns it.
	function StringMe( object ){
		return JSON.stringify( object );
	}
	//Hide Keyboard and disable input
	function HideInput(){
		document.activeElement.blur();
		$('input').blur();
		$('select').blur();
	}
	//Converts object into a stringed version adn reutns it.
	function StringMe( object ){
		return JSON.stringify( object );
	}

	// Using Phonegaps Notification system, alert the user to the issue.
	// Requires a message, title, function to do after hitting the button, and a Button name
	function NotifyAlert( msg, dothis, title, button ){
		navigator.notification.alert(msg, dothis, title , button);
	}

//Notify confirmation
	function NotifyConfirm( msg, dothis, title, buttons){
		navigator.notification.confirm(msg,dothis,title,buttons);
	}

//Notify prompt
	function NotifyPrompt( msg, dothis, title, button, defaultText){
		navigator.notification.prompt(msg, dothis, title , button, defaultText);
	}

	function StartApp(){
		$('#btnTogPanel').trigger("tap");

		AppStarted = true;
		 if( ThisDevice.Browser == true){
			//Hiding SplashScreen
		}else{
			navigator.splashscreen.hide();
		}
	}

	// Bind phoengap events to the document.
	document.addEventListener("deviceready", PhoneGap.ready, false);
	document.addEventListener("backbutton", PhoneGap.back, false);
	document.addEventListener("pause", PhoneGap.pause, false);
	document.addEventListener("resume", PhoneGap.resume, false);
	document.addEventListener("online", PhoneGap.online, false);
	document.addEventListener("offline", PhoneGap.offline, false);

	window.onorientationchange = orientationFix;

	var HammerOptions = {
		preventMouse:true,
		transformMinScale: 1.1,

	}

	$('#btnLogbook').hammer( HammerOptions ).on("tap", function ( event ){
		console.log("hizsdbgfhsdfhidbh");
		Shadow.show();
		$('#logbook').removeAttr("novis");
	});


	$('#btnTogPanel').hammer( HammerOptions ).on("tap", function ( event ){
		event.preventDefault();

		if( openPanel == false ){
			openPanel = true;
			$(this).parents('page').find('content>panel.master').toggleClass("out").toggleClass("in");
			$('map>viewport').attr("novis", "");
			ClearDevices();
			setTimeout(function() {
				$('map>viewport').removeAttr("novis")
				ResizeMap();
			}, 100);
			setTimeout(function() {
				openPanel = false;
			}, 1000);
		}
	});

	$('#btnLogin').hammer( HammerOptions ).on("tap", function ( event ){
		if( $('#inputUsername').val() == '' ||  $('#inputPassword').val() == '')
			// AddMessage("Username or password is blank", "flag");
			AddMessage("Username or password is blank", "long", "top");
		else{
			Spinner.show();

			if( GetConnection() == true){
				var u = $('#inputUsername').val(), p = $('#inputPassword').val();
				setTimeout(function() {
					AjaxUserLogin( u, p);

				}, 125);
			}else{
				Spinner.hide();
				// AddMessage("Connection is offline", "flag");
				AddMessage("Connection is offline", "long", "top");
			}
		}
	});
	$('#btnContinue').hammer( HammerOptions ).on("tap", function ( event ){
		if( Settings.logged == true){

			AddMessage("Loading Groups", "short", "top");
			Spinner.show();

			if( GetConnection() == true ){
				LoginPage.hide();

				Ajax.groups();
			}else{
				LoginPage.hide();
				// File.read.groups();
				ReadFile.groups();
			}
		}else{
			// AddMessage("No previous user","flag");
			AddMessage("No previous user","short", "center");
		}
	});

	$('#btnDownload').hammer( HammerOptions ).on("tap", function ( event ){
		$('#MapTitle').empty().html("OneStop");
		if( GetConnection() == true){

			$('#MapsMasterPanel').removeAttr("left").removeAttr("right").attr("open", "");
			$('#DevicesOnMapPanel').removeAttr("open").removeAttr("left").removeAttr("right").attr("left", "");
			$('#MissingDevicesPanel').removeAttr("open").removeAttr("left").removeAttr("right").attr("right", "");
			$('#informationPanel').removeAttr("open").removeAttr("left").removeAttr("right").attr("left", "");

			$('map>viewport>pog.selecteddevice').removeClass("selecteddevice");
			$('#MapsMasterPanel').removeAttr("right").attr("open", "");

			ClearMap();
			ClearDevices();

			Spinner.show();

			CurrentMap = 0;
			CurrentDevice = 0;
			Maps.length = 0;
			Devices.length = 0;
			Changes.length = 0;
			Delete.length = 0;

			$('li.button.remove').removeClass("remove");
			// $('#btnBin').parents('.master').attr("novis", "");
			$('#deleteoptions').attr("novis", "");
			$('#deleteoptions').prev().removeAttr("novis");


			Ajax.maps();
		}else{
			Spinner.hide();

			// AddMessage("Device offline. Unable to download data", "error-bad")
			AddMessage("Device offline. Unable to download data", "long", "center")
		}
	});

	$('#btnBin').hammer( HammerOptions ).on("tap", function ( event ){
		if( Delete.length > 0){
			// AddMessage("Deleting devices", "spin")
			AddMessage("Deleting devices - Remeber to save", "short", "top")
			Spinner.show();

			for (var i = 0; i < Delete.length; i++) {
				for (var n = 0; n < Devices.length; n++) {
					if( Devices[n].ID_Device == Delete[i]){
						Devices[n].ID_Map = 0;
						Devices[n].Image = "devimg/default.png";
						Devices[n].Locked = false;
						Devices[n].X = 0;
						Devices[n].Y = 0;
					}
				};
				RemoveChanges(Delete[i]);
			};

			// Map.drawDevices();
			// File.write.data();
			WriteFile.data();
			OnMapDevices.length = 0;
			OffMapDevices.length = 0;

			for (var i = 0; i < Devices.length; i++) {
				if( Devices[i].ID_Map == CurrentMap.ID_Map ){
					OnMapDevices.push( Devices[i] );
				}
				if( Devices[i].ID_Map == 0 ){
					OffMapDevices.push( Devices[i] );
				}
			};
			OnMapDevices = SplitIntoGroups( OnMapDevices );
			OffMapDevices = SplitIntoGroups( OffMapDevices );

			OnMapFunctions.empty();
			OffMapFunctions.empty();

			LoadOnMapDevices();
			LoadOffMapDevices();

			setTimeout(function() {
				OnMapFunctions.MoveForward();
			}, 100);


			DrawDevicesOnMap();
			// $('#btnBin').parents('row.master').attr("novis", "");
			$('#deleteoptions').attr("novis", "");
			$('#deleteoptions').prev().removeAttr("novis");
			$('#btnBinSelected').html(" 0 ");
			Delete.length = 0;
		}else{
			AddMessage("Nothing to delete", "short", "top")
		}
	});

	$('map>viewport>img').hammer( HammerOptions ).on("touch", function(event){
		$('map>viewport>.selecteddevice').removeClass("selecteddevice");
	})

	$('#btnSave').hammer( HammerOptions ).on("tap", function ( event ){
		if( Changes.length > 0){
			if(GetConnection() == true ){

				// MessageSpinner.show("Uploading", "Sending changes to the server");
				// Addmessage("Saving changes to server.", "spin start")
				// Spinner.AddMessage("Saving changes to server.");
				// AddMessage("Saving changes to server", "long", "top");
				Spinner.show();

				setTimeout(function() {
					Ajax.changes();
				}, 100);

			}else{
				// AddMessage("Saving changes to device", "long", "top");
				Spinner.show();


				var tmp = new Array();
				for (var i = 0; i < Changes.length; i++) {
					tmp.push( Changes[i] );
				};
				Changes.length = 0;

				var fileName = 'changes.json';
				try{
					window.requestFileSystem( RequestLocalSystem(), RequestSize, function ( fs ){
						fs.root.getDirectory("OSMobile", {create:true}, function ( de ){
							de.getFile( fileName , {create: false}, function (fe){
								fe.file( function( file ){
									var r = new FileReader();
									r.onload = function(e){
										if( this.result.length > 0){
											var result = JSON.parse(this.result);
											Changes = result;
											Changes.splice( Changes.length-1, 1);
											for (var i = 0; i < tmp.length; i++) {
												Changes.push( tmp[i] );
											};
											Settings.changes = 1;
											WriteFile.settings();
											WriteFile.changes();
											WriteFile.data();

											setTimeout(function() {
												Spinner.hide();
												// AddMessage("Changes saved local");
												AddMessage("Changes saved local", "short", "top");
											}, 100);


										}else{
											alert("No Changes");
										}
									}
									r.readAsText(file);

								},File.error);
							}, function(e){
								if( e.code == 1){
									for (var i = 0; i < tmp.length; i++) {
										Changes.push( tmp[i] );
									};
									Settings.changes = 1;
									WriteFile.settings();
									WriteFile.changes();
									WriteFile.data();
									setTimeout(function() {
										Spinner.hide();
										// AddMessage("Changes saved local");
										AddMessage("Changes saved local", "short", "top");

									}, 100);
								}else{
									File.error(e);
								}
							});
						},File.error);
					},File.error);
				}catch(e){
					alert( e.toString() );
				}
			}
		}else{
			// AddMessage("0 changes have been made");
			AddMessage("0 changes have been made", "short", "top");
		}
	});


	// $(window).hammer( HammerOptions ).on("tap", 'a.button.back#btnPanelBack', function (event){
	// 	PanelTree.MoveBackward();
	// 	swipeing = true;
	// });

	var backButton = false;

	$( window ).hammer( HammerOptions ).on("tap", 'a.button.back#btnBack', function ( event ){
		if( backButton == false ){
			backButton = true;
			if( $(this).parents('panel.child').attr("id") == "MissingDevicesPanel"){
				$('#MissingDevicesPanel').removeAttr("open").attr("right", "");
				$('#DevicesOnMapPanel').removeAttr("left").removeAttr("right").attr("open");
			}
			if( $(this).parents('panel.child').attr("id") == "informationPanel"){

				$('#informationPanel').removeAttr("open").attr("left", "");


				if( DeviceChange == true ){

					$('#DevicesOnMapPanel').removeAttr("right").removeAttr("left").attr("open", "");
					$('#MissingDevicesPanel').removeAttr("right").removeAttr("left").removeAttr("open").attr("right", "");

					OnMapDevices.length = 0;

					for (var i = 0; i < Devices.length; i++) {
						if( Devices[i].ID_Map == CurrentMap.ID_Map ){
							OnMapDevices.push( Devices[i] );
						}
					}
					OnMapDevices = SplitIntoGroups( OnMapDevices );
					OnMapFunctions.empty();
					LoadOnMapDevices();

					setTimeout(function() {
						OnMapFunctions.MoveForward();
					}, 100);

					DeviceChange = true;
				}else{
					$('#DevicesOnMapPanel').removeAttr("right").removeAttr("left").attr("open", "");
					$('#MissingDevicesPanel').removeAttr("right").removeAttr("left").removeAttr("open").attr("right", "");
				}

				if( DeviceAdd == true){

					$('#MissingDevicesPanel').removeAttr("right").removeAttr("left").attr("open", "");
					// $('#MissingDevicesPanel').removeAttr("right").removeAttr("left").removeAttr("open").attr("right", "");

					OnMapDevices.length = 0;
					OffMapDevices.length = 0;

					for (var i = 0; i < Devices.length; i++) {
						if( Devices[i].ID_Map == CurrentMap.ID_Map ){
							OnMapDevices.push( Devices[i] );
						}
						if( Devices[i].ID_Map == 0 ){
							OffMapDevices.push( Devices[i] );
						}
					};
					OnMapDevices = SplitIntoGroups( OnMapDevices );
					OffMapDevices = SplitIntoGroups( OffMapDevices );

					OnMapFunctions.empty();
					OffMapFunctions.empty();

					LoadOnMapDevices();
					LoadOffMapDevices();

					setTimeout(function() {
						OnMapFunctions.MoveForward();
					}, 100);
					DeviceAdd = true;
				}else{
					$('#DevicesOnMapPanel').removeAttr("right").removeAttr("left").attr("open", "");
					$('#MissingDevicesPanel').removeAttr("right").removeAttr("left").removeAttr("open").attr("right", "");
				}
			}
			if( $(this).parents('panel.child').attr("id") == "DevicesOnMapPanel"){
				$('#DevicesOnMapPanel').removeAttr("open").attr("left", "");
				$('#MapsMasterPanel').removeAttr("right").removeAttr("left").attr("open", "");
			}
			if( $(this).parents('float.master').attr("id") == "GroupSelect"){
				var parentId = $(this).parents('row.master').prev().find("panel[open]")
				if( parentId.prev().attr("root") != null )
					$('#GroupsMasterGroup').parent().next().attr("novis","");
				$.each($('#GroupsMasterGroup>panel.group').find('row.item'), function(index, item){
					if( $(item).attr("fullpath") == parentId.attr("child")){
						parentId.removeAttr("open").attr("right", "");
						$(item).parents('panel.child').removeAttr("left").removeAttr("right").attr("open", "");
					}
				});
			}
			$('map>viewport>pog.selecteddevice').removeClass("selecteddevice");
		}
		setTimeout(function() {
			backButton = false;
		}, 700);
	});

	$('#btnExit').hammer( HammerOptions ).on("tap", function (event){
		navigator.app.exitApp();
	});

 	var maptapped = false;

	$(window).hammer( HammerOptions ).on("tap",".map", function ( event ){
		if( maptapped == false){
			Spinner.show();

			maptapped = true;

			var id = $(this).attr("id");

			// $('li.button.current').removeClass("current").children('i').remove();
			$('li.button.remove').removeClass("remove");

			Delete.length = 0;
			// $('#btnBin').parents('.master').attr("novis", "");
			$('#deleteoptions').attr("novis", "");
			$('#deleteoptions').prev().removeAttr("novis");

			if( CurrentMap.ID_Map == id){
				setTimeout(function() {
					$('#MapsMasterPanel').removeAttr("open").attr("right", "");
					$('#DevicesOnMapPanel').removeAttr("left").attr("open", "");
				}, 10);
			}else{
				ClearMap();
				for (var i = 0; i < Maps.length; i++) {
					if( Maps[i].ID_Map == id ){
						CurrentMap = Maps[i];
					}
				};

				DrawTitle();

				// DrawAvalibleDevices();
				setTimeout(function() {
					OnMapDevices.length = 0;
					OffMapDevices.length = 0;

					for (var i = 0; i < Devices.length; i++) {
						if( Devices[i].ID_Map == CurrentMap.ID_Map ){
							OnMapDevices.push( Devices[i] );
						}
						if( Devices[i].ID_Map == 0 ){
							OffMapDevices.push( Devices[i] );
						}
					};
					OnMapDevices = SplitIntoGroups( OnMapDevices );
					OffMapDevices = SplitIntoGroups( OffMapDevices );

					OnMapFunctions.empty();
					OffMapFunctions.empty();

					LoadOnMapDevices();
					LoadOffMapDevices();

					setTimeout(function() {
						OnMapFunctions.MoveForward();
					}, 100);

				}, 100);

				//REMEMBER ME
				ReadFile.maps();
			}
		}
		setTimeout(function() {
			maptapped = false;
		}, 200);
	});

	var mDeviceOptions = {
		preventDefault: true,
		preventMouse: true,
	}

	var prev= {
		event: null,
		target: null,
		dist: 0,
		maxdist: 0,
		scrolling: false,
		scrolltimeout: false,
		dragging: false,
	};

	var scrolltimeout = null;
	$('scroll.y').hammer(HammerOptions).on("scroll", function(e){
		e.preventDefault();

		if( prev.dragging == false ){

			$(prev.target).css("-webkit-transform", "");

			prev.event = null;
			prev.target = null;

			clearTimeout( scrolltimeout );
			prev.scrolltimeout = true;
			scrolltimeout = setTimeout(
				function(event){
					console.log("Timeout Scrolling");
					prev.scrolltimeout = false;
	           	}, 500);
		}else{
			e.preventDefault();
			e.gesture.stopDetect();

		}
	});

	$(window).hammer(mDeviceOptions).on("tap dragright dragup dragdown release", ".mDevice", function(e){
		switch(e.type){
			case "tap":
				e.stopPropagation();
				e.preventDefault();
				var id = $(this).attr("id");
				CurrentDevice = GetDevice( id );

				$.each($('map>viewport>pog'), function(index, item){
					if( $(item).attr("id") == CurrentDevice.ID_Device ){
						$(item).addClass("selecteddevice");
					}
				});

				setTimeout(function() {
					$('#DevicesOnMapPanel').removeAttr("open").attr("right", "");
					$('#MissingDevicesPanel').removeAttr("open").attr("right", "");
					$('#informationPanel').removeAttr("left").attr("open", "");

				}, 10);

				DisplayDeviceInformation();
			break;
			case "dragright":

				if( prev.scrolltimeout == false ){
					if( prev.scrolltimeout == false ){
						prev.dragging = true;
						prev.event = "dragright";
						prev.target = $(this);
						prev.maxdist = (parseFloat( $(prev.target).width() ) / 2 /2);
						e.gesture.distance = Math.min(prev.maxdist, e.gesture.distance);
						$(prev.target).css("-webkit-transform", "translate3d("+e.gesture.distance +"px,0px,0px)");
						$(prev.target).parents('scroll').attr("scroll", $(prev.target).parents('scroll').scrollTop() );
						prev.dist = e.gesture.distance;
					}
				}
			break;
			case"release":
				if( prev.scrolltimeout == false ){
					if( prev.scrolltimeout == false ){
						if( prev.dist == prev.maxdist && prev.event == "dragright" ){

							if($(prev.target).hasClass("remove") ){
								for (var i = 0; i < Delete.length; i++) {
									if( Delete[i] == $(prev.target).attr("id") ){
										Delete.splice(i,1);
										$('#btnBinSelected').html(Delete.length+" selected");

									}
								};

								try{
									$.each($('map>viewport>pog'), function(index, item){
										if( $(item).attr("id") == $(prev.target).attr("id") ){
											$(item).removeClass("togDelete");
										}
									});
								}catch(e){
									alert(e.toString() + " adding errror")
								}


								$(prev.target).removeClass("remove");
							}else{
								try{
									$.each($('map>viewport>pog'), function(index, item){
										if( $(item).attr("id") == $(prev.target).attr("id") ){
											$(item).addClass("togDelete");
										}
									});
								}catch(e){
									alert(e.toString() + " removal errror")
								}

								Delete.push($(prev.target).attr("id"));
								$('#btnBinSelected').html(Delete.length+" selected");
								$(prev.target).addClass("remove");
							}

							if( Delete.length > 0){
								$('#deleteoptions').removeAttr("novis");
								$('#deleteoptions').prev().attr("novis", "");
							}else{
								$('#deleteoptions').attr("novis", "");
								$('#deleteoptions').prev().removeAttr("novis");
							}

							$(prev.target).css("-webkit-transform", "");
							$(prev.target).parents('scroll').scrollTop ( $(prev.target).parents('scroll').attr("scroll"));
							prev.target = null;
							prev.event = null;

							prev.dist = 0;
							prev.maxdist = 0;
						}else{
							$(prev.target).css("-webkit-transform", "");
							prev.target = null;
						}
						prev.dragging = false;
					}
				}
			break;
		}
	})

	$(window).hammer(mDeviceOptions).on("tap drag dragright release", ".uDevice", function(e){
		switch(e.type){
			case "drag":
				if( prev.scrolltimeout == false ){
					if( e.gesture.center.pageX > $(this).parents('panel.master').width()){
						$('#ulFloat').removeAttr("novis");
						$('#ulFloat').css({
							"left" : e.gesture.center.pageX,
							"top" : e.gesture.center.pageY,
						});
					}else{
						$('#ulFloat').attr("novis", "" );
						$('#ulFloat').css({
							"left" : 0,
							"top" : 0
						});
					}
				}
			break;
			case "dragright":
				if( prev.scrolltimeout == false ){
					if( prev.scrolltimeout == false ){
						if( prev.target == null){
							prev.target = $(this);
						}
						$(prev.target).parents('scroll').attr("scroll", $(prev.target).parents('scroll').scrollTop() );

						var x = e.gesture.center.pageX - ($(prev.target).width()/2/2);
						$(prev.target).css({
							"-webkit-transform" : "translate3d("+ x +"px,"+0+"px,0px)",
						});
						$(prev.target).parents('scroll').css("overflow-y", "hidden");

						$(prev.target).parents('scroll').scrollTop( $(prev.target).parents('scroll').attr("scroll") );
					}
				}
			break;
			case "release":
				if( prev.scrolltimeout == false ){
					if( prev.scrolltimeout == false ){
						$(prev.target).css({
							"-webkit-transform" : "",
						});
						$(prev.target).parents('scroll').css("overflow-y", "auto");
						$(prev.target).parents('scroll').scrollTop( $(prev.target).parents('scroll').attr("scroll") );

						var x = e.gesture.center.pageX;
						var y = e.gesture.center.pageY;

						var elem = document.elementFromPoint( x, y);
						if( elem.nodeName == "IMG" || elem.nodeName == "POG"){

							$('#ulFloat').attr("value", $(prev.target).attr("id"));

							Delete.length = 0;
							// $('#btnBin').parents('row.master').attr("novis", "");
							$('#deleteoptions').attr("novis", "");
							$('#deleteoptions').prev().removeAttr("novis");
							$('#btnBinSelected').html(" 0 ");

							AddDeviceOnMap( x, y);

							$('#ulFloat').attr("novis", "" );
							$('#ulFloat').css({
								"left" :"",
								"top" : ""
							});
							$('#ulFloat').attr("value", null );
						}else{
							$('#ulFloat').attr("novis", "" );
							$('#ulFloat').css({
								"left" :"",
								"top" : ""
							});
							$('#ulFloat').attr("value", null );
						}

						prev.target = null;
					}
				}
			break;
		}
	})

	$(window).hammer( HammerOptions ).on("tap", "map>viewport>pog",function(event){

		$('map>viewport>pog.selecteddevice').removeClass("selecteddevice");
		var device = GetDevice($(this).attr("id"));
		CurrentDevice = device;
		$(this).addClass("selecteddevice");

		setTimeout(function() {
			$('#DevicesOnMapPanel').removeAttr("open").attr("right", "");
			$('#informationPanel').removeAttr("left").attr("open", "");
			$('#MissingDevicesPanel').removeAttr("open").attr("right", "");

		}, 10);

		DisplayDeviceInformation();

	});

	var DragEvent = {
		startObj: null,
		delta: {
			x:0,y:0,
		},
		dtObj: null,
		doubletap: false,
	}

	$( document.body ).hammer(  ).on("dragstart drag dragend", 'map>viewport>pog.unlocked', function(e){
		$('map>viewport>pog.selecteddevice').removeClass("selecteddevice");

		switch( e.type ){
			case "dragstart":
				var device = GetDevice($(this).attr("id"));
				CurrentDevice = device;
				DisplayDeviceInformation();
				DragEvent.startObj = $(this);
			break;
			case "drag":
					var offset = $('map').position();
					var image = {
						w: $('map>viewport>img').width(),
						h: $('map>viewport>img').height(),
					}
					var left = $('map>viewport>img').attr("offset").split(" ")[0];
					var top = $('map>viewport>img').attr("offset").split(" ")[1];
					var buffer = 10;
					var maxX = parseFloat(image.w) - (buffer*2);
					var maxY = parseFloat(image.h) - buffer;

					DragEvent.delta.x = e.gesture.center.pageX - parseFloat( offset.left) - parseFloat(left);
					DragEvent.delta.y = e.gesture.center.pageY - parseFloat( offset.top) - parseFloat(top);

					DragEvent.delta.x = Math.max(buffer,DragEvent.delta.x);
					DragEvent.delta.y = Math.max(buffer,DragEvent.delta.y);
					DragEvent.delta.x = Math.min(maxX, DragEvent.delta.x);
					DragEvent.delta.y = Math.min(maxY, DragEvent.delta.y);

					var rot = "";
					var n = "1,0,0,-1";
					var s = "1,0, 0, 1";
					var e = "0,-1, 1, 0";
					var w = "0, 1, -1, 0";
					var se = "1,-0.5,0.5,1";
					var sw = "1,-0.5,-0.5,1";
					var ne = "-1,-0.5,0.5,-1";
					var nw = "-1,0.5,-0.5,-1";

					//make this a percentage of the map width & height
					rot = s;
					if( DragEvent.delta.x < 70)
						rot = w;
					if( DragEvent.delta.x > parseFloat( image.w ) - 70)
						rot = e;
					if( DragEvent.delta.y < 70 )
						rot = n;

					$(DragEvent.startObj).css({
						"-webkit-transform" : "matrix("+rot+","+DragEvent.delta.x+","+DragEvent.delta.y+")",
					});
				for (var i = 0; i < Devices.length; i++) {
					if( Devices[i].ID_Device == $(DragEvent.startObj).attr('id') ){
						Devices[i].X = DragEvent.delta.x / parseFloat( $('map>viewport>img').width()) * MAPWIDTH;
						Devices[i].Y = DragEvent.delta.y / parseFloat( $('map>viewport>img').height()) * MAPHEIGHT;
						if( CurrentDevice.ID_Device == Devices[i].ID_Device) {
								$('#infoDevicePosition').val( Devices[i].X.toFixed(0)+" : "+ Devices[i].Y.toFixed(0) );
						}
					}
				};
			break;
			case "dragend":
				console.log("Drag end");

				var matrix = $(DragEvent.startObj).css("-webkit-transform");
				matrix = matrix.substr(matrix.lastIndexOf("(")).replace(/\(|\)/g,"").split(", ");
				var x = parseFloat ( matrix[4] );
				var y = parseFloat ( matrix[5] );
				x = x / parseFloat( $('map>viewport>img').width()) * MAPWIDTH;
				y = y / parseFloat( $('map>viewport>img').height()) * MAPHEIGHT;

				for (var i = 0; i < Devices.length; i++) {
						if( Devices[i].ID_Device == $(DragEvent.startObj).attr('id') ){
							Devices[i].X = x;
							Devices[i].Y = y;
							AddChanges( Devices[i].ID_Device, 'position', Devices[i].X.toFixed(0)+" "+Devices[i].Y.toFixed(0));
							if( CurrentDevice.ID_Device == Devices[i].ID_Device) {
									$('#infoDevicePosition').val( Devices[i].X.toFixed(0)+" : "+ Devices[i].Y.toFixed(0) );
							}
						}
				};
				DragEvent.startObj = null;
			break;
		}
	})


//Nothing to see here
	$('map>viewport').hammer(HammerOptions).on("transformstart transform transformend", function(e){
		e.preventDefault();
		// switch( e.type ){
		// 	case "transformstart":
		// 		transform.start = e.gesture.center;
		// 	break;
		// 	case "transform":

		// 		transform.scale = Math.max( 1.0, e.gesture.scale * transform.oldScale) ;
		// 		transform.scale = Math.min( 5, transform.scale);
		// 		transform.matrix = $(this).css("-webkit-transform").replace(/(matrix)|([\()])/g, " ").split(",");
		// 		$(this).css("-webkit-transform", "matrix("+transform.scale+",0,0,"+transform.scale+",0,0)");


		// 	break;
		// 	case "transformend":
		// 		transform.oldScale = transform.scale;
		// 		transform.end = e.gesture.center;
		// 	break;
		// }
	});

	function GetFirstGroup(){
		console.log("getting first group");

		$('#GroupPanel>panel.group').empty();

		var id = Groups[0].ID_Group;
		for (var i = 0; i < Groups.length; i++) {
			if( Groups[i].ID_Group == id){
				ChangeGroup( i );
			}
		};
		// PanelTree.MoveForward( Groups[0] );
		GroupTree.MoveForward();
	}


	$("#inputselectGroup").parent().hammer( HammerOptions ).on("tap", function(e){
		$('#MapTitle').empty().html("OneStop");

		if( $('float#GroupSelect').attr("novis") != null){
			Shadow.show();

			setTimeout(function() {
				ClearMap();
				ClearDevices();
				MapImage = false;
				CurrentMap = new Object();
				CurrentDevice = new Object();
				OffMapDevices.length = 0;
				OnMapDevices.length = 0;
					$('float#GroupSelect').removeAttr("novis")
			}, 10);
		}
	});

	$(window).hammer( HammerOptions ).on("tap",'a.button.close',function(e){
		Shadow.hide();
		$(this).parents('float.master').attr("novis", "");
		if( $(this).parents('float.master').attr("id") == "logbook" ){
			$('#logbookLog').children('.master').removeClass("expand").removeClass("collapse").addClass("expand");
		};

		setTimeout(function() {
			// $('float#GroupSelect').attr("novis", "");
		}, 10);
	})
	var movingGroup = false;
	$( window ).hammer( HammerOptions ).on("tap",  "a.button.hasKids", function(e){
		Spinner.show();
		if( movingGroup == false){
			var id = $(this).parent().attr("fullPath");


			GroupTree.MoveForward( id );
			// Spinner.show();
			// var id = $(this).attr("value");
			// PanelTree.MoveForward( id );
			movingGroup = true;
		}
		setTimeout(function() {
			movingGroup = false;
		}, 700);
	});

	$(window ).hammer( HammerOptions ).on("tap",  ".isselected", function(e){

		var id = $(this).parent().attr("groupid");
		if( movingGroup == false){
			for (var i = 0; i < Groups.length; i++) {
				if( Groups[i].ID_Group == id ){
					ChangeGroup(i);
				}
			};
			movingGroup = true;
			setTimeout(function() {
				$('float#GroupSelect').attr("novis", "");
				Shadow.hide();
			},100);


		}
		setTimeout(function() {
			movingGroup = false;
		}, 700);
	});

	$('#btnExtSelectCancel').hammer( HammerOptions  ).on("tap", function(event){
		try{
			ExtSelect.hide();

		}catch(e){

			console.log(e);
		}
	})

	//Bind swipe events to the swipe indicator if it is shown..
	$("panel[right]>swipe").hammer( HammerOptions  ).on("tap dragright swiperight dragleft swipeleft", function(e){
		// var pvis = $('panel.master').hasClass("in");
		$('#btnTogPanel').trigger("tap");
		e.stopPropagation();
		e.preventDefault();
		e.gesture.stopDetect();
	});

	$('#btnDeviceImageClose').hammer( HammerOptions ).on("tap", function(event){
		$(this).parents('display.master').attr("novis", "");

	})

	$('#btnDeviceImage').hammer( HammerOptions ).on("tap", function (event){
		Shadow.show();
		DeviceImage.show();
		ReadFile.devImg();
	});

	$('#btnUsePhoto').hammer( HammerOptions ).on("tap", function (event){
		DeviceImage.hide();
		DeviceImage.ClearImage();

		setTimeout(function() {
			Camera.getCameraroll();
		}, 10);
	});
	$('#btnNewPhoto').hammer( HammerOptions ).on("tap", function (event){
		DeviceImage.hide();
		DeviceImage.ClearImage();
		setTimeout(function() {
			Camera.getPicture();
		}, 10);
	});

	$('row.item>label.text').hammer( HammerOptions ).on("tap", function(e){
		console.log(" working ");
		var target = $(this).children('input').attr("id");
		var title="", msg="",buttons=["Ok","Cancel"],value="", defaultText="";
		console.log( target )
		switch( target ){
			case "infoDeviceDescription":
				NotifyPrompt(
					"Give the device a new description",
					function(results){
						if( results.buttonIndex == 1){
							ChangeInformation( results.input1, "description");
						}
					},
					"Device Description",
					buttons,
					CurrentDevice.Description);

			break;
			case "infoDeviceLocation":
					NotifyPrompt(
					"Change location",
					function(results){
						if( results.buttonIndex == 1){
							ChangeInformation( results.input1, "location");
						}
					},
					"Device Location",
					buttons,
					CurrentDevice.Location);
			break;
			case "infoDeviceSerialNumber":
					NotifyPrompt(
					"Change the serial number",
					function(results){
						if( results.buttonIndex == 1){

							ChangeInformation( results.input1, "serialnumber");
						}
					},
					"Serial Number",
					buttons,
					CurrentDevice.SerialNumber);
			break;
			case "infoDevicePosition":
				return 0;
			break;
		}

	})

	$('a.button.locate').hammer(HammerOptions).on("tap", function(e){
		$.each($('map>viewport>pog'), function(index, item){
			if( $(item).attr("id") == CurrentDevice.ID_Device ){
				$(item).addClass("selecteddevice");
			}
		});
	})

	$('#infoDeviceLock').hammer( HammerOptions ).on("change", function (event){
		ChangeInformation( $('#infoDeviceLock').prop("checked"), 'locked');
	});

	$(window).hammer(HammerOptions).on("tap", "dropdown.head", function(event){

		$(this).parent().toggleClass("expand").toggleClass("collapse");
		$(this).next().children().removeClass("collapse").addClass("expand");
	});

	$('#btnClearLog').hammer(HammerOptions).on("tap", function(event){
		$('#logbookLog').empty();
	})

	$('#inputUsername, #inputPassword').on("focus blur", function ( event ){
		if( event.type == "focus")
			$(this).focus();
			$(this).parents('div').css({
				"margin-bottom" : "50%",
			});
		if( event.type == "blur")
			$(this).parents('div').css({
				"margin-bottom" : "0%",
		});
	});

	$('#btnAddDevices').hammer(HammerOptions).on("tap", function(e){
		if( !btnAddHit ){
			btnAddHit = true;
			$(this).parents('panel.child').removeAttr("left").attr("left", "");
			$('#MissingDevicesPanel').removeAttr("right").attr("open", "");
			OffMapFunctions.empty();
			Spinner.show();
			LoadOffMapDevices();
			setTimeout(function() {
				OffMapFunctions.MoveForward();
			}, 500);
			setTimeout(function() {
				btnAddHit = false;
			}, 700);
		}
	})

	$('shadow').hammer( HammerOptions ).on("touch release", function(e){
		if( !$('float#GroupSelect').attr("novis") )
			$('float#GroupSelect').attr("novis", "");
		if( !$('#logbook').attr("novis") ){
			$('#logbook').attr("novis", "");
			$('#logbookLog').children('.master').removeClass("expand").removeClass("collapse").addClass("expand");
		}

		if( !$('#DeviceImageDisplay').attr("novis") )
			DeviceImage.hide();


		Shadow.hide();
	})
	$(window).hammer(HammerOptions).on("tap", "a.button#btnforwards_Off", function(e){
		OffMapFunctions.MoveForward();
	});
	$(window).hammer(HammerOptions).on("tap", "a.button#btnbackwards_Off", function(e){
		OffMapFunctions.MoveBackward();
	});

	$(window).hammer(HammerOptions).on("tap", "a.button#btnforwards_On", function(e){
		OnMapFunctions.MoveForward();
	});
	$(window).hammer(HammerOptions).on("tap", "a.button#btnbackwards_On", function(e){
		OnMapFunctions.MoveBackward();
	});

	$(window).hammer(HammerOptions).on("tap", "a.button#btnforwards", function(e){
		var indicator = $(this).prev('indicator')
		var num = parseInt( indicator.html() );

		var group = $(this).parents('row.master')[0];
		group = $(group).prev();
		// group.children('panel[right]>scroll').scrollTop(0);
		if( group.children('panel[open]').next().length != 0 ){
			if( !moving ){
				var prev = group.children('panel[open]');
				var next = prev.next();
				next.show();
				moving = true;
				indicator.html( num+=1 );
				setTimeout(function() {
					prev.removeAttr("open").attr("left", "");
					next.show().removeAttr("right").attr("open", "");
				}, 0);
				setTimeout(function() {
					moving = false;
					prev.hide();
				}, 700);
			}
		}
	});

	$(window).hammer(HammerOptions).on("tap", "a.button#btnbackwards", function(e){
		var indicator = $(this).next('indicator');
		var num = parseInt( indicator.html() );
		var group = $(this).parents('row.master')[0];
			group = $(group).prev();
		// group.children('panel[right]>scroll').scrollTop(0);
		if( group.children('panel[open]').prev().length != 0 ){
			if( !moving ){
				var prev = group.children('panel[open]');
				var next = prev.prev();
				next.show();
				moving = true;
				indicator.html( num-=1 );
				setTimeout(function() {
					prev.removeAttr("open").attr("right", "");
					next.removeAttr("left").attr("open", "");
				}, 0);
				setTimeout(function() {
					moving = false;
					prev.hide();
				}, 700);
			}
		}
	});

	$(window, document).on("submit", function(event){
		event.preventDefault();
		return false;
	})

	$(window).hammer(HammerOptions).on("touch", "input", function(e){
		e.preventDefault();
	})
}catch(e){
	alert(e.toString())
	console.log(e.toString() );
}
});
