angular.module('Sparrowz', ['ngSanitize'])
    .controller('AppCtrl', ['$scope', '$http', '$q', function($scope, $http, $q) {
        $scope.thData = {};
        //$http.defaults.headers.common['O2_TOKEN_1'] = "SESSION2211475043132410";
        $scope.selectedChoice = {
            value: ''
        }
        $scope.message = {
            data: ""
        }
        var getCityList = function() {
            var deferred = $q.defer();
            var formData = {
                "header": {
                    clientId: "SPARROWZ_WEBSITE",
                    apiVersion: apiVersion
                },
                body: {}
            }
            console.log('form data to get treasureHunts: ', formData);
            var req = {
                method: 'POST',
                url: URL + "/services/guest/getCities",
                headers: {
                    'Content-Type': 'application/json'
                },
                data: formData
            }
            $http(req).then(
                function(response) {
                    console.log("getCityList response: ", response);
                    deferred.resolve(response.data.body);
                },
                function(error) {
                    console.log("Error: ", error);
                    $http.get('assets/city.json').then(
                        function(response) {
                            console.log("getCityList response: ", response);
                            deferred.resolve(response.data.body);
                        },
                        function(error) {
                            console.log("Error: ", error)
                            deferred.reject("error");
                        }
                    )
                }
            )
            return deferred.promise;
        }

        var getCurrentPosition = function() {
                var deferred = $q.defer();

                if (!navigator.geolocation) {
                    deferred.reject('Geolocation not supported.');
                } else {
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            deferred.resolve(position);
                        },
                        function(err) {
                            deferred.reject(err);
                        });
                }

                return deferred.promise;
            }
            /*getGeoCordinates*/
        var getCityName = function(position) {
                var deferred = $q.defer();
                $scope.geolat = position.coords.latitude;
                $scope.geolng = position.coords.longitude;
                getGeoCoderData(position).then(function(geocoderData) {
                    extractCityFromGeocoderData(geocoderData).then(function(cityName) {
                        console.log('got user current city: ', cityName);
                        deferred.resolve(cityName);
                    }, function(err) {
                        console.log('user current city couldn\'t extract from geocoder');
                        deferred.reject("error");
                    });
                }, function(error) {
                    console.log('error getting current position: ', error);
                    deferred.reject("error");
                });
                return deferred.promise;
            }
            /*geocoderData*/
        var getGeoCoderData = function() {
                var deferred = $q.defer();
                if (!google) {
                    console.log("google not defined");
                    deferred.reject('google not defined');
                } else {
                    var geocoder = new google.maps.Geocoder();
                    var latlng = new google.maps.LatLng($scope.geolat, $scope.geolng);
                    geocoder.geocode({
                            'latLng': latlng
                        },
                        function(results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                if (results[0] && results[1]) {
                                    console.log('geocoder data: ', results[1]);
                                    deferred.resolve(results[1]);
                                } else {
                                    console.log("address not found");
                                    deferred.reject(results);
                                }
                            } else {
                                console.log("address not found");
                                deferred.reject(results);
                            }
                        });
                }
                return deferred.promise;
            }
            /*extractGeocoderData*/
        var extractCityFromGeocoderData = function(geocoderData) {
            var deferred = $q.defer();
            var city = {
                long_name: null
            }
            var indice = 0;
            for (var j = 0; j < geocoderData.address_components.length; j++) {
                if (geocoderData.address_components[j].types[0] == 'locality') {
                    indice = j;
                    console.log('index found at: ', j)
                }
            }
            city = geocoderData.address_components[indice];
            console.log('cityName by new method: ', city.long_name)

            deferred.resolve(city.long_name);
            return deferred.promise;
        }
        var onloadPage = function() {
            getCityList().then(function(cityList) {
                console.log("got response", cityList);
                $scope.cityData = cityList;
                var lent = $scope.cityData.cityList.length;
                console.log("CityList length: ", lent);
                getCurrentPosition().then(function(position) {
                    console.log("got position", position);
                    getCityName(position).then(function(cityName) {
                        console.log("got cityname:", cityName);
                        var cityIndexId = null;
                        for (var i = 0; i < $scope.cityData.cityList.length; i++) {
                            if (cityName == $scope.cityData.cityList[i].cityName) {
                                cityIndexId = i;
                            }
                        }
                        if (cityIndexId != null) {
                            var cityInfo = $scope.cityData.cityList[cityIndexId];
                            $scope.city_name = cityInfo.cityDisplayName;
                            $scope.setCity(cityInfo.cityId).then(function() {
                                getTHAndLoapMap(cityInfo.cityId);
                            }, function(err) {
                                console.log("error");
                            });
                        } else {
                            selectDefaultCity();
                        }
                    }, function(err) {
                        console.log(err);
                    }); /*getCityName*/
                }, function(err) {
                    console.log(err);
                    selectDefaultCity();
                }); /*getCurrentPosition*/
            }, function(error) {
                console.log(error);
            }); /*getCityList*/
        }

        onloadPage();
        var selectDefaultCity = function() {
            $scope.city_name = "Bengaluru";
            console.log("CITY NAME: ", $scope.city_name);
            $scope.setCity(1).then(function() {
                    getTHAndLoapMap(1);
                },
                function(err) {
                    console.log("error");
                });
        }
        $scope.setErrorMessage = function() {
                $scope.message = {
                    data: "We’ll be back in a while..."
                }
            }
            //Select city
        $scope.setCity = function(city_id) {
            var deferred = $q.defer();
            /*MCQ option added in banner*/
            $http.get('assets/mcq.json').then(
                function(response) {
                    $scope.mcqData = response.data.body;
                    console.log("Response: ", response);
                    console.log("MCQ Data: ", $scope.mcqData.mcq);
                    for (var j = 0; j < $scope.mcqData.mcq.length; j++)
                        if ($scope.mcqData.mcq[j].cityId == city_id) {
                            var x = Math.floor((Math.random() * $scope.mcqData.mcq[j].mcqQuestions.length));
                            $scope.question = $scope.mcqData.mcq[j].mcqQuestions[x].question;
                            console.log($scope.question);
                            $scope.answer = $scope.mcqData.mcq[j].mcqQuestions[x].answer;
                            console.log($scope.answer);
                            $scope.mcqOptions = $scope.mcqData.mcq[j].mcqQuestions[x].opts;
                            console.log('MCQ options: ', $scope.mcqOptions);
                            $scope.success = $scope.mcqData.mcq[j].mcqQuestions[x].successMessage;
                            $scope.failure = $scope.mcqData.mcq[j].mcqQuestions[x].failureMessage;
                        }
                },
                function(error) {
                    console.log("Error: ", error)
                }
            )
            if (city_id == '11') {
                console.log(city_id);
                document.body.style.backgroundImage = "url('img/bg.jpg')";
            } else {
                console.log(city_id);
                document.body.style.background = "white";
            }
            deferred.resolve();
            return deferred.promise;
        }
        var getTHAndLoapMap = function(city_id) {
            var formData = {
                "header": {
                    clientId: "SPARROWZ_WEBSITE",
                    apiVersion: apiVersion
                },
                body: {
                    "cityId": city_id
                }
            }
            console.log('form data to get treasureHunts: ', formData);
            var req = {
                method: 'POST',
                url: URL + "/services/guest/getTreasureHunts",
                headers: {
                    'Content-Type': 'application/json'
                },
                data: formData
            }
            $http(req).then(
                function(response) {
                    $scope.thData = response.data.body;
                    console.log(response.data.body);
                    console.log("TH Data: ", $scope.thData);
                    for (var i = 0; i < $scope.thData.treasureHunts.length; i++) {
                        $scope.addData($scope.thData, i);
                    }
                    loadMap($scope.thData);
                },
                function(error) {
                    console.log("Error: ", error);
                    $scope.setErrorMessage();
                    $http.get('assets/thlist_' + city_id + '.json').then(
                        function(response) {
                            $scope.thData = response.data.body;
                            console.log(response.data.body);
                            console.log("TH Data: ", $scope.thData);
                            for (var i = 0; i < $scope.thData.treasureHunts.length; i++) {
                                $scope.addData($scope.thData, i);
                            }
                            loadMap($scope.thData);
                        },
                        function(error) {
                            console.log("Error: ", error);
                        }
                    )
                }
            )
        }

        $scope.changeCity = function(city_id, cityDisplayName) {
            $scope.city_name = cityDisplayName;
            $scope.setCity(city_id).then(function() {
                getTHAndLoapMap(city_id);
            }, function(err) {
                console.log("error");
            });

        }
        var loadMap = function(thData) {

            var bounceTimer;
            var attachinfo = function(markersData, index) {
                var marker = markersData[index].geoLocationDetails.marker;
                google.maps.event.addListener(marker, 'mouseover', function() {
                    if (this.getAnimation() == null || typeof this.getAnimation() === 'undefined') {
                        clearTimeout(bounceTimer);
                        var that = this;
                        bounceTimer = setTimeout(function() {
                                that.setAnimation(google.maps.Animation.BOUNCE);
                            },
                            500);
                    }
                });

                google.maps.event.addListener(marker, 'mouseout', function() {
                    if (this.getAnimation() != null) {
                        this.setAnimation(null);
                    }
                    clearTimeout(bounceTimer);
                });

                google.maps.event.addListener(marker, 'click', (function() {
                    console.log("Print", markersData[index]);
                    closeInfoBox();
                    getInfoBox(markersData[index]).open(mapObject, this);
                    console.log(markersData[index]);
                    mapObject.setCenter(new google.maps.LatLng(markersData[index].geoLocationDetails.latitude, markersData[index].geoLocationDetails.longitude));
                }));
            }

            markersData = thData.treasureHunts;
            var lat = thData.treasureHunts[0].geoLocationDetails.latitude;
            var lng = thData.treasureHunts[0].geoLocationDetails.longitude;
            console.log("new: ", lat, lng);
            mapObject = new google.maps.Map(document.getElementById('map'), {
                zoom: 13,
                center: new google.maps.LatLng(lat, lng),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    position: google.maps.ControlPosition.LEFT_CENTER
                },
                panControl: false,
                panControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                zoomControl: true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.LARGE,
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                scrollwheel: false,
                scaleControl: false,
                scaleControlOptions: {
                    position: google.maps.ControlPosition.LEFT_CENTER
                },
                streetViewControl: true,
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                styles: [{
                    "featureType": "landscape",
                    "stylers": [{
                        "hue": "#FFBB00"
                    }, {
                        "saturation": 43.400000000000006
                    }, {
                        "lightness": 37.599999999999994
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "road.highway",
                    "stylers": [{
                        "hue": "#FFC200"
                    }, {
                        "saturation": -61.8
                    }, {
                        "lightness": 45.599999999999994
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "road.arterial",
                    "stylers": [{
                        "hue": "#FF0300"
                    }, {
                        "saturation": -100
                    }, {
                        "lightness": 51.19999999999999
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "road.local",
                    "stylers": [{
                        "hue": "#FF0300"
                    }, {
                        "saturation": -100
                    }, {
                        "lightness": 52
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "water",
                    "stylers": [{
                        "hue": "#0078FF"
                    }, {
                        "saturation": -13.200000000000003
                    }, {
                        "lightness": 2.4000000000000057
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "poi",
                    "stylers": [{
                        "hue": "#00FF6A"
                    }, {
                        "saturation": -1.0989010989011234
                    }, {
                        "lightness": 11.200000000000017
                    }, {
                        "gamma": 1
                    }]
                }]

            });
            console.log("current: ", lat, lng);
            console.log('markersData', markersData);
            for (var item = 0; item < markersData.length; item++) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(markersData[item].geoLocationDetails.latitude, markersData[item].geoLocationDetails.longitude),
                    map: mapObject,
                    icon: 'img/pins/' + markersData[item].kind + '.png',
                });

                markersData[item].geoLocationDetails.marker = marker;
                attachinfo(markersData, item);
            }

            var closeInfoBox = function() {
                $('div.infoBox').remove();
            };

            var getInfoBox = function(item) {
                ga("send", {
                    hitType: "event",
                    eventCategory: "THmarker",
                    eventAction: "User clicked on " + item.treasureHuntName + " marker in map",
                    eventLabel: "USER_CLICKED_ON_TH_MARKER",
                    eventValue: 0
                })
                return new InfoBox({
                    closeBoxMargin: '2px -20px 2px 2px',
                    closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
                    content: '<div class="marker_info_2">' +
                        '<img src="' + item.treasureHuntImgUrl[0] + '" width="240" height="80" class="img-responsive" alt="Image" onerror="this.src=\'img/no image.jpg\'" >' + '<br/>' +
                        '<h3 style="color:blue;">' + item.treasureHuntName + '</h3>' +
                        '<span>' + item.treasureHuntDescription + '</span>' + '<br/>' +
                        /*'<a href="'+ item.url_point + '" class="btn_1">Details</a>' +*/
                        '</div>',
                    disableAutoPan: true,
                    maxWidth: 0,
                    pixelOffset: new google.maps.Size(10, -200),

                    isHidden: false,
                    pane: 'floatPane',
                    enableEventPropagation: true
                });
                closeInfoBox();
            };
        }
            /*var getFilename=function(img_url){
          var image_name=img_url.substring(img_url.lastIndexOf('/') + 1);
          return image_name;	
	}*/
            //Bootstrap modal for TH details    
        $scope.onHtmlClick = function(item) {
            $scope.states = {};
            ga("send", {
                hitType: "event",
                eventCategory: "ViewOnMap",
                eventAction: "User clicked on " + item.treasureHuntName + " view on map",
                eventLabel: "USER_CLICKED_ON_VIEW_ON_MAP",
                eventValue: 0
            })
            console.log("Hunt : ", item);
            google.maps.event.trigger(item.geoLocationDetails.marker, "click");
        };

        $scope.cardClick = function(name, image, description, time, th_id) {
            ga("send", {
                hitType: "event",
                eventCategory: "THcard",
                eventAction: "User clicked on " + name + " card ",
                eventLabel: "USER_CLICKED_ON_TH_CARD",
                eventValue: 0
            })
            $scope.modalName = name;
            $scope.modalImage = image;
            $scope.modalDescription = description;
            $scope.approx_Time = time;
            $scope.qr_id = th_id;
        }
            //functions for weburl	
        var SplitTheStringForDot = function(ResultStr) {
            var DtlStr = [];
            if (ResultStr != null) {
                var SplitChars = '.';
                if (ResultStr.indexOf(SplitChars) >= 0) {
                    DtlStr = ResultStr.split(SplitChars);
                    return DtlStr;
                } else {
                    DtlStr[0] = ResultStr;
                    return DtlStr;
                }
            }
        };
        var SplitTheStringForSlash = function(ResultStr) {
            var DtlStr = [];
            if (ResultStr != null) {
                var SplitChars = '/';
                if (ResultStr.indexOf(SplitChars) >= 0) {
                    DtlStr = ResultStr.split(SplitChars);
                    return DtlStr;
                } else {
                    DtlStr[0] = ResultStr;
                    return DtlStr;
                }
            }
        };

        var cocncatString = function(name_array) {
            var newFile_name = name_array[0] + "_web_small." + name_array[1];
            return newFile_name;
        }

        var getWebImageUrl = function(img_url) {
            var url_array = SplitTheStringForSlash(img_url);
            var len = url_array.length;
            var filename_array = SplitTheStringForDot(url_array[len - 1]);
            url_array[len - 1] = cocncatString(filename_array);
            var newPathname = "";
            for (i = 1; i < url_array.length; i++) {
                newPathname += "/";
                newPathname += url_array[i];
            }
            newPathname = window.location.protocol + newPathname;
            console.log("Path name: ", newPathname);
            return newPathname;
        }
            /*function for mcq answer submission*/
        $scope.submitAnswer = function() {
            console.log("Result from select: ", $scope.selectedChoice.value);
            console.log("MCQ answer: ", $scope.answer);
            if ($scope.selectedChoice.value == $scope.answer) {
                $scope.submitImgUrl = "img/correct.png";
                $scope.submitMessage = "Congratulations. Your answer is correct.";
                $scope.cluedetail = $scope.success;
            } else {
                $scope.submitImgUrl = "img/wrong.png";
                $scope.submitMessage = "Sorry wrong answer. Better luck next time.";
                $scope.cluedetail = $scope.failure;
            }
        }
        /*angular ga event*/
        $scope.goToEventPage=function(thName){
            ga("send",{
                hitType:"event",
                eventCategory:"BuyTickets",
                eventAction:"User clicked on "+thName+" event buy tickets button",
                eventLabel:"USER_CLICKED_ON_BUY_TICKETS_BUTTON",
                eventValue:0
        })}
        /*function for adding data to json*/
        $scope.addData = function(thData, index) {
            console.log("Values in addData: ", thData, index);
            var TH_tag=null; 
            if($scope.thData.treasureHunts[index].treasureHuntTags[0] && $scope.thData.treasureHunts[index].treasureHuntTags[0].tagName){
               TH_tag = $scope.thData.treasureHunts[index].treasureHuntTags[0].tagName ? $scope.thData.treasureHunts[index].treasureHuntTags[0].tagName : null;
            }else{
                TH_tag=null;
            }
            if (typeof $scope.thData.treasureHunts[index].treasureHuntImgUrl !== 'undefined') {
                $scope.thData.treasureHunts[index].treasureHuntImgUrl[0] = getWebImageUrl($scope.thData.treasureHunts[index].treasureHuntImgUrl[0]);
            } else {
                $scope.thData.treasureHunts[index].treasureHuntImgUrl = ["img/no image.jpg"];
            }
            if(TH_tag){
                console.log("Tag name: ",TH_tag);
                if (TH_tag == 'OldRio') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Museums";
                    $scope.thData.treasureHunts[index].game_icon = "icon-museum";
                } else if (TH_tag == 'RioMarathonRoute') {
                    $scope.thData.treasureHunts[index].rate = "top_rated";
                    $scope.thData.treasureHunts[index].kind = "Sport";
                    $scope.thData.treasureHunts[index].game_icon = "icon-school";
                } else if (TH_tag == 'WeekendChallenge') {
                    $scope.thData.treasureHunts[index].rate = "new";
                    $scope.thData.treasureHunts[index].kind = "Sport";
                    $scope.thData.treasureHunts[index].game_icon = "icon-person";
                } else if (TH_tag == 'RioCentro') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Walking";
                    $scope.thData.treasureHunts[index].game_icon = "icon-person";
                } else if (TH_tag == 'Kormangala') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag-checkered";
                } else if (TH_tag == 'AdarshVista') {
                    $scope.thData.treasureHunts[index].rate = "new";
                    $scope.thData.treasureHunts[index].kind = "Museums";
                    $scope.thData.treasureHunts[index].game_icon = "icon-town-hall";
                } else if (TH_tag == 'BeachWalk') {
                    $scope.thData.treasureHunts[index].rate = "top_rated";
                    $scope.thData.treasureHunts[index].kind = "Beach";
                    $scope.thData.treasureHunts[index].game_icon = "icon-waves";
                } else if (TH_tag == 'HeritageBengaluru' || TH_tag == 'Dommaluru') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag";
                } else if (TH_tag == 'LalbaghChallenge') {
                    $scope.thData.treasureHunts[index].rate = "top_rated";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-road";
                } else if (TH_tag == 'MGRoad') {
                    $scope.thData.treasureHunts[index].rate = "top-rated";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-road";
                } else if (TH_tag == 'India') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag";
                } else if (TH_tag == 'Technology Tour') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-monitor-1";
                } else if (TH_tag == 'FortKochi' || TH_tag == 'HighwayCafe') {
                    $scope.thData.treasureHunts[index].rate = "top_rated";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-anchor-2";
                } else if (TH_tag == 'Delhi') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag";
                } else if (TH_tag == 'Mumbai') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-town-hall";
                } else if (TH_tag == 'Dubai') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag-checkered";
                } else if (TH_tag == 'IIMB') {
                    $scope.thData.treasureHunts[index].rate = "top_rated";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-town-hall";
                } else if (TH_tag == 'ChristRedeemer') {
                    $scope.thData.treasureHunts[index].rate = "popular";
                    $scope.thData.treasureHunts[index].kind = "Walking";
                    $scope.thData.treasureHunts[index].game_icon = "icon-person";
                } else if (TH_tag == 'MakeHeritageFun') {
                    $scope.thData.treasureHunts[index].rate = "new";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag-checkered";
                } else {
                    $scope.thData.treasureHunts[index].rate = "new";
                    $scope.thData.treasureHunts[index].kind = "Th";
                    $scope.thData.treasureHunts[index].game_icon = "icon-flag";
                }
            }else{
                console.log("No tags found");
                $scope.thData.treasureHunts[index].rate = "new";
                $scope.thData.treasureHunts[index].kind = "Th";
                $scope.thData.treasureHunts[index].game_icon = "icon-flag";
            }
            if($scope.thData.treasureHunts[index].treasureHuntId==60){
                $scope.thData.treasureHunts[index].eventUrl="https://www.eventshigh.com/detail/Bangalore/390e015da07eda8f2c445c41e1662ff8-sparrowz-lalbagh-adventure";
            }else if($scope.thData.treasureHunts[index].treasureHuntId==53){
                $scope.thData.treasureHunts[index].eventUrl="https://www.eventshigh.com/detail/Bangalore/6e1f35dc36e71fcce9c61f8c9e0b7973-sparrowz-cubbon-treasure-hunt";
            }else{
                $scope.thData.treasureHunts[index].eventUrl=null;
            }    
        }
    }])