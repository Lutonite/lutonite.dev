/**
*   SRTD - SimRail Train Describer
*
*   A train describer for the popular Polish train simulation game,
*   made with love (and not enough time!...) by Angelo :-)
*
*   SPDX-License-Identifier: CC-BY-NC-SA-4.0
*  Avec Stations-User
*
* Traduit et adapté par RWag64.
*
**/

var settings = {
    server: "int1",
    colour: "white ",
	colour2: "green ",
	colour3: "pink2 ",
	showCameras: false,
	showTables: false,
	showClosedTrack: false,
	showHornZone: false,
	showRadioChannel: false,
	showDottedLines: false,
    drawScanLines: false,
    flipped: false,
    showTrainSpeed: true,
    showNextSignalSpeed: true,

    loggingSignalNames: false,
    recording: true,
    replaying: false,
};

var selectedSetting = Object.keys(settings)[0];

var availableSettings = {
    server: [],
    colour: ["green ", "white ", "orange", "pink  ", "red   ", "blue  ", "yellow"],
	colour2: ["white ", "orange", "pink  ", "red   ", "blue  ", "yellow", "green "],
	colour3: ["white ", "orange", "pink  ", "pink2 ", "red   ", "blue  ", "yellow", "green "],
	showCameras: [true, false],
	showTables: [false, false],
	showClosedTrack: [false, false],
	showHornZone: [true, false],
	showRadioChannel: [true, false],
	showDottedLines: [true, false],
    drawScanLines: [true, false],
    flipped: [false, true],
    showTrainSpeed: [false, true],
	showNextSignalSpeed: [false, true],

};

const coloursPalette = {
    "green ": ["#000", "#00FF00"],
    "white ": ["#000", "#ffffff"],
    "pink2 ": ["#000", "#eac8f0"],
    "orange": ["#000", "#FF8000"],
    "pink  ": ["#000", "#FBF"],
    "red   ": ["#000", "#FF0000"],
    "blue  ": ["#000", "#305CDE"],
    "yellow": ["#000", "#FFEE00"],
}
 
const serversListUrl = "https://panel.simrail.eu:8084/servers-open";
const constUrl = "https://panel.simrail.eu:8084/trains-open?serverCode=";
const stationsUrl = "https://panel.simrail.eu:8084/stations-open?serverCode=";

var coordinates = {};
var signalDirections = {};

var loggedSignalNames = {};
var recorded = null;


var	colour2 = [];
var	colour3 = [];
var	train1 = [];  // Indice (inutilisé)
var	train3 = [];
var	train4 = [];  // autre
var	train5 = [];  // N° du Train
var	train6 = [];  // Type : Bot ou User
var	train7 = [];  // 1er véhicule (loco ...)
var	train8 = [];  // Loco Type
var	train9 = [];  // VMax Loco
var	train10 = [];  // Type du Convoi (en 3 lettres) ROJ EIP ...
var	train11 = [];  // Origine (en 8 lettres) Warszawa ...
var	train12 = [];  // Destination (en 8 lettres) Warszawa ...
var	train13 = [];  // Origine (en 8 lettres) Warszawa ...
var	train14 = [];  // Destination (en 8 lettres) Warszawa ...

var cnv, ctx, box, ni, x, x2, speedbox1, train2, train3, vmax;
globalThis.senstrain = -1;
globalThis.speedbox2 = 1;
// globalThis.train3 = 1;
globalThis.station0 = 1;
globalThis.station1 = 1;
globalThis.station2 = 1;
globalThis.station3 = 1;
globalThis.user = "NO ";
globalThis_area0 = "Settings";
globalThis_nbTrainUsers = 0;
globalThis_nbStationUsers = 0;
globalThis.userstation = "NO ";
globalThis.userstation2 = "NO ";
globalThis.couleurtrain = "green ";
globalThis.showLoco = false;
globalThis.showSpeed = false;
globalThis.showTypeTrain = false;
globalThis.showOrigine = false;
globalThis.showDestination = false;
globalThis.showEntry = false;
globalThis.showExit = false;
globalThis.Key = "";

        for (let i = 0; i < 200; i++) {
			train1[i] = 0;
			train3[i] = 0;
			train4[i] = 0;
			train5[i] = 0;
			train6[i] = 0;
			train7[i] = 0;
			train8[i] = 0;			
			train9[i] = 0;
			train10[i] = 0;
			train11[i] = 0;
			train12[i] = 0;
			train13[i] = 0;
			train14[i] = 0;			
		}

const textSize = 36;
const textSizeRatio = 2;
const textMargin = 1;

const charsPerRow = 160; // We could simulate ye olde 80 columns... but we won't!
const textLines = 120 / textSizeRatio; // For a proper 4 / 3 CRT monitor!
const screenRatio = charsPerRow / textSizeRatio / textLines; // Used to be fixed at 4 / 3, now it's N lines - way easier to deal with!
const screenWidth = charsPerRow * textSize / textSizeRatio * textMargin;
const screenHeight = screenWidth / screenRatio;

var area = "Settings";
/// var area = "L001_KO_Zw";
var isCurrentlyFlipped = false;

addEventListener("load", start);


	
function start() {
    initSettings();
    initCoords();
    initCnv();
    initServersList();
    updateTrainDescriber();
    updatestationDescriber();

    const interval = setInterval(function () {
        if (!settings.replaying) {
            updateTrainDescriber(true);
            updatestationDescriber(true);

        }
    }, 2000);
}

function initSettings() {
    let href = window.location.href.split("#");
    if (href.length > 1) {
        let settingsString = href[1];
        let settingId = 0;
        for (let setting of settingsString.split("_")) {
            let settingName = Object.keys(settings)[settingId];
            let setTo = setting;
            if (settingId) {
                setTo = availableSettings[settingName][setTo];
            }
            settings[settingName] = setTo;
            settingId++;
            if (Object.keys(settings)[settingId] == undefined) {
                continue;
            }
        }
    }
    updateTrainDescriber();
    updatestationDescriber();
}

addEventListener("hashchange", initSettings);

async function getDataFromServer(url = constUrl + settings.server) {
    // https://stackoverflow.com/questions/2499567/how-to-make-a-json-call-to-an-url/2499647#2499647
    const getJSON = async url => {
        const response = await fetch(url);
        return response.json();
    }
    let data;
    await getJSON(url).then(output => data = output);
    return (data);
}
async function getstationDataFromServer(url = stationsUrl + settings.server) {
    // https://stackoverflow.com/questions/2499567/how-to-make-a-json-call-to-an-url/2499647#2499647

    const getJSON = async url => {
        const response = await fetch(url);
        return response.json();
    }
    let stationdata;
    await getJSON(url).then(output => stationdata = output);
    return (stationdata);
}

function initCoords() {
    let logUndefinedSignals;
    for (let id in layouts) {
        logUndefinedSignals = [];
        coordinates[id] = {};
        signalDirections[id] = {};
        for (let row in layouts[id]) {
            let signalsList = layouts[id][row].split("'");
            let signalId = 1;
            for (let char in layouts[id][row].split("'")[0]) {
                switch (layouts[id][row][char]) {
                    case "{":
                    case "}":
                        for (let signalName of ("" + signalsList[signalId]).split("%")) {
                            coordinates[id][signalName] = [layouts[id][row][char] == "}" ? char - 5 : char * 1, row * 1];
                            signalDirections[id][signalName] = layouts[id][row][char] == "}" ? 1 : 0;
                            if (signalName != "§" && id != "Settings" && !allSignals.includes(signalName)) {
                                if (signalName == "undefined") {
                                    logUndefinedSignals.push([row, char]);
                                } else {
                                    console.warn("Signal " + signalName + " in layout " + id + " doesn't seem to exist in SimRail!");
                                }
                            }
                        }
                        signalId++;
                        break;
                }
            }
        }
        if (coordinates[id]["§"] != undefined) {
            delete coordinates[id]["§"];
        }
        if (logUndefinedSignals.length) {
            console.warn("Found undefined signals in layout %c" + id + "%c:", "color: #A0A0FF", "color: black", logUndefinedSignals);
        }
        //if (coordinates[id].undefined != undefined) {
        //    console.warn("At least one signal is missing in layout " + id + "! The last one I found was @ ", coordinates[id].undefined)
        //}
    }
}

function initCnv() {
    cnv = document.getElementById("cnv");
    ctx = cnv.getContext("2d", { alpha: false });

    cnv.style.position = "absolute";

    if (window.innerWidth >= window.innerHeight * screenRatio) { // Using a larger monitor
        cnv.style.height = window.innerHeight;
        cnv.style.width = window.innerHeight * screenRatio;
    } else { // Using a thinner monitor
        cnv.width = window.innerWidth;
        cnv.height = window.innerWidth / screenRatio;
    }

    ctx.width = screenWidth;
    ctx.height = screenHeight;

    cnv.width = screenWidth;
    cnv.height = screenHeight;

    document.body.style.overflow = 'hidden';
}

async function initServersList() {
    let servers = await getDataFromServer(serversListUrl);
    let serversList = [];
    for (let server of servers.data) {
        serversList.push(server.ServerCode);
    }
    availableSettings.server = serversList;
}

async function updateTrainDescriber(calledByTimer = false, data = undefined) {
    flipLayouts();
    if (data === undefined) {

        data = await getDataFromServer();
        data = polishData(data);
		findnbTrainUsers(data);
    }
    addClosedTracks(data);
    drawCanvas(data);

    if (settings.loggingSignalNames) {
        logSignalNames(data);
    }
    if (calledByTimer && settings.recording) {
//        data = polishData(data);
        recordTrains(data);

    }
    drawVitalSymbol(calledByTimer);	
}

async function updatestationDescriber(calledByTimer = false, data = undefined) {

    flipLayouts();

        stationdata = await getstationDataFromServer();
		findnbStationUsers(stationdata);
		
//    if (calledByTimer && settings.recording) {
//        recordstation(stationdata);
//
//    }
	
}

function polishData(data) {
 //   data = findMissingSignals(data);
	    data = locateTrainsWithoutSignalInFront(data);
    for (let i in data.data) {
//        delete data.data[i].EndStation;
        delete data.data[i].ServerCode;
//        delete data.data[i].StartStation;
//        delete data.data[i].TrainName;
//        delete data.data[i].Type;
//        delete data.data[i].Vehicles;
        delete data.data[i].id;
//        delete data.data[i].TrainData.ControlledBySteamID;
    }
    return data;
}

function findnbTrainUsers(data) {
	globalThis_nbTrainUsers = 0;
    for (let i in data.data) {
	user = data.data[i].TrainData.ControlledBySteamID;
	if (user != null)  {
	globalThis_nbTrainUsers = globalThis_nbTrainUsers + 1;
}
}
}

function polishstationData(stationdata) {

// on enleve polishstation

    for (let i in stationdata.data) {

        delete stationdata.data[i].Latititude;
        delete stationdata.data[i].Longitude;
        delete stationdata.data[i].MainImageURL;
        delete stationdata.data[i].AdditionalImage1URL;
        delete stationdata.data[i].AdditionalImage2URL;
        delete stationdata.data[i].id;
//        delete stationdata.data[i].DispatchedBy.SteamId;
    }
    return stationdata;
}

function findnbStationUsers(stationdata) {
	globalThis_nbStationUsers = 0;
    for (let i in stationdata.data) { 
	userStation = stationdata.data[i].DispatchedBy;
	if (userStation != "")  {
	globalThis_nbStationUsers = globalThis_nbStationUsers + 1;
}
}
}

function distance (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function locateTrainsWithoutSignalInFront(data)
{
    if (!recorded) return data;
		
    for (let i in data.data) 
    {
        let distanceFromLastSeenAtSignal = 0;
        let lastSeenAtSignal = null;

        if (data.data[i].TrainData.SignalInFront !== null) continue;

        for (let train of recorded.data)
        {
            if (train.TrainNoLocal != data.data[i].TrainNoLocal || !train.TrainData.SignalInFront) continue;

            lastSeenAtSignal = train.TrainData.SignalInFront;
            distanceFromLastSeenAtSignal = train.TrainData.DistanceToSignalInFront;
        }

        if (!!lastSeenAtSignal && (lastSeenAtSignal.split("@")[1] == "-Infinity" || distanceFromLastSeenAtSignal > 5000))
        {
            data.data[i].TrainData.SignalInFront = lastSeenAtSignal;
            if (distanceFromLastSeenAtSignal > 5000)
            {

            }
        }
        else if (!!lastSeenAtSignal)
        {
            for (let signal in missingSignals)
            {
                if (missingSignals[signal].includes(lastSeenAtSignal.split("@")[0])) {
                    data.data[i].TrainData.SignalInFront = signal + "@-Infinity";

                    break;
                }
                // Just to avoid spamming the log with trains that went missing for a good reason:
                if (signalsLeadingToTheBackrooms.includes(lastSeenAtSignal.split("@")[0])) {
                    data.data[i].TrainData.SignalInFront = lastSeenAtSignal;
                }
            }
        }

        //Last resort: Try finding the train by coordinates.
        if (!data.data[i].TrainData.SignalInFront)
        {
            let lat = data.data[i].TrainData.Latititute;
            let longi = data.data[i].TrainData.Longitute;

//	if ((globalThis.train4 != 1)) {
numtrain = data.data[i].TrainNoLocal
numb = numtrain / 2;
numtrain2 = numb.toFixed(0);
        if ((numtrain2 *2) != numtrain) {

  for (let signal in missingSignalsByGPSLeft) {
           
//                let distAB = Math.round(distance(...missingSignalsByGPSRight[signal]) * 1000000) / 1000000;
//                let distAC = distance(missingSignalsByGPSRight[signal][0], missingSignalsByGPSRight[signal][1], lat, longi);
//                let distBC = distance(lat, longi, missingSignalsByGPSRight[signal][2], missingSignalsByGPSRight[signal][3]);
//                let sumDist = Math.round((distAC + distBC) * 1000000) / 1000000;
//
	numb0 = missingSignalsByGPSLeft[signal][0];
	numb1 = missingSignalsByGPSLeft[signal][1];
	numb2 = missingSignalsByGPSLeft[signal][2];
	numb3 = missingSignalsByGPSLeft[signal][3];
			distAB = Math.round((distance(numb0, numb1, numb2, numb3)) * 1000) / 1000;
//			distAC = Math.round((distance(numb0, numb1, lat, longi)) * 1000) / 1000;
//			distBC = Math.round((distance(lat, longi, numb2, numb3)) * 1000) / 1000;
			distAC = distance(numb0, numb1, lat, longi);
			distBC = distance(lat, longi, numb2, numb3);

			sumDist = Math.round((distAC + distBC) * 1000) / 1000;
//            if (distAB == sumDist) {
            if ((distAB >= (sumDist - 0.01)) && (distAB <= (sumDist + 0.01))) {
                    data.data[i].TrainData.SignalInFront = signal + "@-Infinity";
                    break;
                }
//                }
            }
			
    } else {
				
            for (let signal in missingSignalsByGPSRight) {
           
//                let distAB = Math.round(distance(...missingSignalsByGPSRight[signal]) * 1000000) / 1000000;
//                let distAC = distance(missingSignalsByGPSRight[signal][0], missingSignalsByGPSRight[signal][1], lat, longi);
//                let distBC = distance(lat, longi, missingSignalsByGPSRight[signal][2], missingSignalsByGPSRight[signal][3]);
//                let sumDist = Math.round((distAC + distBC) * 1000000) / 1000000;
//
	numb0 = missingSignalsByGPSRight[signal][0];
	numb1 = missingSignalsByGPSRight[signal][1];
	numb2 = missingSignalsByGPSRight[signal][2];
	numb3 = missingSignalsByGPSRight[signal][3];
///                if ((numb0 < lat) && (lat > numb2)) {
///					if ((numb1 > longi) && (longi < numb3)) {
			distAB = Math.round((distance(numb0, numb1, numb2, numb3)) * 1000) / 1000;
//			distAC = Math.round((distance(numb0, numb1, lat, longi)) * 1000) / 1000;
//			distBC = Math.round((distance(lat, longi, numb2, numb3)) * 1000) / 1000;
			distAC = distance(numb0, numb1, lat, longi);
			distBC = distance(lat, longi, numb2, numb3);
			sumDist = Math.round((distAC + distBC) * 1000) / 1000;
//            if (distAB == sumDist) {
            if ((distAB >= (sumDist - 0.01)) && (distAB <= (sumDist + 0.01))) {
						data.data[i].TrainData.SignalInFront = signal + "@-Infinity";
                    break;
           }
///                }
            }
			
    }
    }
    }
    let logTrainsWithNoSignal = "";
    for (let i in data.data) {
        if (data.data[i].TrainData.SignalInFront === null) {
            logTrainsWithNoSignal += data.data[i].TrainNoLocal + ", ";
        }
    }
    if (logTrainsWithNoSignal.length) {
    }
    return data;
}

function addClosedTracks(data) {
   if (settings.showClosedTrack != false) {
    closedTrackDummy = {
        TrainNoLocal : "xxxxxx",
        TrainData : {
            DistanceToSignalInFront : 1.0,
            SignalInFront : "",
            SignalInFrontSpeed : 0.0,
            Velocity : 0.0,
        }
    };

    for (let x of closedTrackSignals) {
        closedTrackDummy.TrainData.SignalInFront = x + "@0,0-0,0";
        data.data.push(structuredClone(closedTrackDummy));
    }
    }
}

function recordTrains(data) {
    recorded = structuredClone(data);
}


function recordstation(stationdata) {
    recorded.push(stationdata);
}


function drawCanvas(data) {

    ctx.font = "normal " + textSize + "px monospace";
    ctx.textBaseline = "top";

    ctx.fillStyle = coloursPalette[settings.colour][0];
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.fillStyle = coloursPalette[settings.colour][1];
    let text = layouts[area];
	
    for (let row in text) {
        for (let char in text[row].split("'")[0]) {		
		ctx.fillStyle = coloursPalette[settings.colour][1];		

    if (area != "Settings") {
		
/// Donne la couleur du caractere
		
			character = text[row][char];
		    if (character == "=") {
				ctx.fillStyle = coloursPalette[settings.colour2][1];
				text[row][char] = "─";
			}
		    if (character == "‡") {
				ctx.fillStyle = "#ff00ff";
				text[row][char] = "‡";
			}
		    if (character == "▲") {
				ctx.fillStyle = "#ffffff";
				text[row][char] = "▲";
			}
		    if (character == "◯") {
				ctx.fillStyle = "#9f9f9f";
				text[row][char] = "◯";
			}
			}

    if (settings.showCameras != false) {
cam1 = "\u278a";
cam2 = "\u278b";
cam3 = "\u278c";
cam4 = "\u278d";
cam5 = "\u278e";
cam6 = "\u278f";
cam7 = "\u2790";
cam8 = "\u2791";
cam9 = "\u2792";
dbl_g = "\u23EA";
dbl_d = "\u23E9";
dbl_h = "\u23EB";
dbl_b = "\u23EC";				
   } else {
cam1 = "\u0020";
cam2 = "\u0020";
cam3 = "\u0020";
cam4 = "\u0020";
cam5 = "\u0020";
cam6 = "\u0020";
cam7 = "\u0020";
cam8 = "\u0020";
cam9 = "\u0020";
dbl_g = " ";
dbl_d = " ";
dbl_h = " ";
dbl_b = " ";
		    if (text[row][char] == "◁") {
				ctx.fillStyle = "#000000";
				text[row][char] = " ";
   }
   		    if (text[row][char] == "▷") {
				ctx.fillStyle = "#000000";
				text[row][char] = " ";
   }
 		    if (text[row][char] == "△") {
				ctx.fillStyle = "#000000";
				text[row][char] = " ";
   }
   		    if (text[row][char] == "▽") {
				ctx.fillStyle = "#000000";
				text[row][char] = " ";
   }
   }
   
    if (settings.showTables != false) {
dbl_g = "\u23EA";
dbl_d = "\u23E9"
dbl_h = "\u23EB"
dbl_b = "\u23EC"
   } else {
dbl_g = " ";
dbl_d = " ";
dbl_h = " ";
dbl_b = " ";
   }
	if (isCurrentlyFlipped != false) { 
dbl_d = "\u23EA";
dbl_g = "\u23E9";
dbl_b = "\u23EB";
dbl_h = "\u23EC";
   }   
				toto = text[row][char];
				lookStation1 = "#"; // bas  "\u23f7"
				lookStation2 = "&"; // haut  "\u23f6"
				lookStation3 = "$"; // gauche  "\u23f4"
				lookStation4 = "?"; // droite  "\u23f5"

	if (isCurrentlyFlipped != false) {   
		    if (text[row][char] == "#") {
				toto = "#*";
   }
   		    if (text[row][char] == "&") {
				text[row][char] = "#";
				lookStation2 = "\u23f7";
   }
   		    if (toto == "#*") {
				text[row][char] = "&";
				lookStation1 = "\u23f6";
   }
		    if (text[row][char] == "$") {
				toto = "$*";
   }
   		    if (text[row][char] == "?") {
				text[row][char] = "$";
				lookStation4 = "\u23f4";
   }
   		    if (toto == "$*") {
				text[row][char] = "?";
				lookStation3 = "\u23f5";
   }
		} else {
				lookStation1 = "\u23f7"; // bas  "\u23f7"
				lookStation2 = "\u23f6"; // haut  "\u23f6"
				lookStation3 = "\u23f4"; // gauche  "\u23f4"
				lookStation4 = "\u23f5"; // droite  "\u23f5"			
   } 
 
switch (text[row][char]) {
case "‡":
// passages à niveau
	text[row][char] = "\u0058"; //  X
	n = "\u0058";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
	ctx.fillStyle = "#ffffff";
	text[row][char] = "\u01C0"; // ǀ
	n = "\u01C0";
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➊":
// caméra ➊ -1-
	text[row][char] = "" + cam1 + "";
	n = "" + cam1 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➋":
// caméra ➋ -2-
	text[row][char] = "" + cam2 + "";
	n = "" + cam2 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➌":
// caméra ➌ -3-
	text[row][char] = "" + cam3 + "";
	n = "" + cam3 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➍":
// caméra ➍ -4-
	text[row][char] = "" + cam4 + "";
	n = "" + cam4 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➎":
// caméra ➎ -5-
	text[row][char] = "" + cam5 + "";
	n = "" + cam5 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➏":
// caméra ➏ -6-
	text[row][char] = "" + cam6 + "";
	n = "" + cam6 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➐":
// caméra ➐ -7-
	text[row][char] = "" + cam7 + "";
	n = "" + cam7 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➑":
// caméra ➑ -8-
	text[row][char] = "" + cam8 + "";
	n = "" + cam8 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "➒":
// caméra ➒ -9-
	text[row][char] = "" + cam9 + "";
	n = "" + cam9 + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "⏫":
	text[row][char] = "" + dbl_h + "";
	n = "" + dbl_h + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "⏬":
	text[row][char] = "" + dbl_b + "";
	n = "" + dbl_b + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "⏪":
	text[row][char] = "" + dbl_g + "";
	n = "" + dbl_g + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "⏩":
	text[row][char] = "" + dbl_d + "";
	n = "" + dbl_d + "";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "@":
// postes d'aiguillage ▣
	text[row][char] = "\u25a3";
	n = "\u25a3";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "$":
// postes d'aiguillage - fleche vers la Gauche ⏴
	text[row][char] = "\u23f4";
//	n = "\u23f4";
	n = lookStation3;
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "?":
// postes d'aiguillage - fleche vers la Droite ⏵
	text[row][char] = "\u23f5";
//	n = "\u23f5";
	n = lookStation4;
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "&":
// postes d'aiguillage - fleche vers le Haut ⏶
	text[row][char] = "\u23f6";
//	n = "\u23f6";
	n = lookStation2;
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
case "#":
// postes d'aiguillage - fleche vers le Bas ⏷
	text[row][char] = "\u23f7";
//	n = "\u23f7";
	n = lookStation1;
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
break;
default:
				toto = text[row][char];
  
	if (isCurrentlyFlipped != false) {
		    if (text[row][char] == "◁") {
				toto = "▷*";
   }
   		    if (text[row][char] == "▷") {
				toto = "◁";
   }
   		    if (toto == "▷*") {
				toto = "▷";
   }

		    if (text[row][char] == "△") {
				toto = "▽*";
   }
   		    if (text[row][char] == "▽") {
				toto = "△";
   }
   		    if (toto == "▽*") {
				toto = "▽";
   }
 
	if ((globalThis_area0 == "Settings") || (globalThis_area0 == "Keys_Used")) {
		} else {		
		    if (text[row][char] == "(") {
				toto = ")*";
   }
   		    if (text[row][char] == ")") {
				toto = "(";
   }
   		    if (toto == ")*") {
				toto = ")";
   }
   } 
   
   }  

    if (settings.showDottedLines != false) {

		if (settings.showHornZone != false) {
			// True True
// ***
	ctx.fillText(toto.replace("{", "─").replace("}", "─"), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);		
// ***
		} else {
			// True False
    ctx.fillText(toto.replace("{", "─").replace("}", "─").replace("▲", " "), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
        }	   

		} else {

	if (settings.showHornZone != false) {
			//False True
// ***
            ctx.fillText(toto.replace("{", "─").replace("}", "─").replace(".", " ").replace(":", " "), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
   } else {
			//False False
            ctx.fillText(toto.replace("{", "─").replace("}", "─").replace(".", " ").replace(":", " ").replace("▲", " "), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
   }	  
   }
    }
   
   
   
   }
   }
	
    if ((globalThis_area0 != "L001_L017_LW_Gr") || (isCurrentlyFlipped == true)) {
		for (let row in menu) {
        for (let char in menu[row]) {
            ctx.fillText(menu[row][char], textSize * char / textSizeRatio * textMargin, textSize * (row * 1 + textLines - menu.length - 1) * textMargin);
		}
        }
   } else {
		for (let row in menu3) {
        for (let char in menu3[row]) {
            ctx.fillText(menu3[row][char], textSize * char / textSizeRatio * textMargin, textSize * (row * 1 + textLines - menu3.length - 1) * textMargin);	   
		}
        }
    }

    if (area == "Settings") {
        drawSettings();
n = "" + 40125 + "";

// green
x = 16;
y = 41;
	ctx.fillStyle = "#0F0";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// yellow
x = 16;
y = 40;
	ctx.fillStyle = "#FF0";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// orange
x = 16;
y = 39;
	ctx.fillStyle = "#E73";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// red
x = 16;
y = 38;
	ctx.fillStyle = "#F00";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// white - colour3
x = 16;
y = 42;
    ctx.fillStyle = coloursPalette[settings.colour3][1];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// colour
nl = settings.colour + ""
n = nl.toUpperCase();
x = 109;
y = 12;
	ctx.fillStyle = coloursPalette[settings.colour][1];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = coloursPalette[settings.colour][1];
	if (nl != "blue  ") {
	ctx.fillStyle = "#000000"; 
	} else {
	ctx.fillStyle = "#ffffff";  
	}
    //Draw number
    for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// colour2
nl = settings.colour2 + ""
n = nl.toUpperCase();
x = 109;
y = 14;
	ctx.fillStyle = coloursPalette[settings.colour2][1];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = coloursPalette[settings.colour][1];
	if (nl != "blue  ") {
	ctx.fillStyle = "#000000"; 
	} else {
	ctx.fillStyle = "#ffffff";  
	}
    //Draw number
    for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// colour3
nl = settings.colour3 + ""
n = nl.toUpperCase();
x = 109;
y = 16;
	ctx.fillStyle = coloursPalette[settings.colour3][1];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = coloursPalette[settings.colour][1];
	if (nl != "blue  ") {
	ctx.fillStyle = "#000000"; 
	} else {
	ctx.fillStyle = "#ffffff";  
	}  
     for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// trains users
n = "BLUE";
x = 46;
y = 44;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 4, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 4; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
n = "<*xxx*";
x = 62;
y = 44;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
n = "*xxx*>";
x = 72;
y = 44;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }	
// postes utilisables
n = "COLOURED";
x = 79;
y = 46;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 8, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
    //Draw number
    for (let i = 0; i < 8; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// postes pris par users
n = "BLUE";
x = 96;
y = 46;
	ctx.fillStyle = "#80dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 4, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 4; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// passages à niveau
///n = "X";
n = "\u0058";
x = 69;
y = 46;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
///n = "│";
n = "\u01C0";
x = 69;
y = 46;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);				
// zones de sifflet
n = "▲";
x = 83;
y = 49;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ffffff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
n = "▲";
x = 83;
y = 50;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ffffff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
// Canaux Radio
n = " ◯";
x = 57;
y = 52;
	ctx.fillStyle = "#888bbb";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 2; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// caméras
n = "\u25b7";
x = 127;
y = 52;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 4, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
n = "\u278a";
x = 125;
y = 52;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 4, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
// Orient Tables
n = "⏫";
x = 77;
y = 48;
//	ctx.fillStyle = "#888bbb";
//    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
//	ctx.fillStyle = "#000000";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
// nb Train Users
n = "" + globalThis_nbTrainUsers + "";
if (globalThis_nbTrainUsers <= 1)  {
n = n + " USER DRIVEN TRAIN";
    } else  {
n = n + " USERS DRIVEN TRAINS";
    }
x = 135;
y = 44;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * n.length, textSize * textMargin);
	ctx.fillStyle = "#000000";
///    //Draw number
    for (let i = 0; i < n.length; i++) {
	ctx.fillStyle = "#000000";
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// nb Station Users
n = "" + globalThis_nbStationUsers + "";
if (globalThis_nbStationUsers <= 1)  {
n = n + " STATION TAKEN";
    } else  {
n = n + " STATIONS TAKEN";
    }
x = 135;
y = 46;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * n.length, textSize * textMargin);
	ctx.fillStyle = "#000000";
///    //Draw number
    for (let i = 0; i < n.length; i++) {
	ctx.fillStyle = "#000000";
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
	
    } else {
		
        let stationToDraw = getstationCoords(stationdata);

        drawstation(stationToDraw);
	if (settings.showHornZone != true) {

// Utilisation de drawRadioBox pour effacer les triangles
area1 = "L001_KO_Zw";
area2 = "L004_Zw_Gr";
area3 = "L001_Zy_WSD";
area4 = "L171_L131";
area5 = "L062_L171_SG_Tl";
area6 = "L062_SPł_Sd";
area7 = "L008_KG_Kz";
area8 = "L001_L017_LW_Gr";

couleur = 1;
	if (isCurrentlyFlipped != true) {
        drawRadioBox("│", 85, 12, area1, couleur);	// SG R52
        drawRadioBox("│", 85, 13, area1, couleur);	// SG R52		
        drawRadioBox("│", 30, 9, area4, couleur);	// SG R52
        drawRadioBox("│", 30, 10, area4, couleur);	// SG R52
        drawRadioBox("│", 30, 9, area5, couleur);	// SG R52
        drawRadioBox("│", 30, 10, area5, couleur);	// SG R52
		} else {
        drawRadioBox("│", 72, 43, area1, couleur);	// SG R52
        drawRadioBox("│", 72, 44, area1, couleur);	// SG R52		
        drawRadioBox("│", 127, 46, area4, couleur);	// SG R52
        drawRadioBox("│", 127, 47, area4, couleur);	// SG R52
        drawRadioBox("│", 127, 46, area5, couleur);	// SG R52
        drawRadioBox("│", 127, 47, area5, couleur);	// SG R52
	}
	}

		if (settings.showRadioChannel != false) {
			
// Radio Channel is true

area1 = "L001_KO_Zw";
area2 = "L004_Zw_Gr";
area3 = "L001_Zy_WSD";
area4 = "L171_L131";
area5 = "L062_L171_SG_Tl";
area6 = "L062_SPł_Sd";
area7 = "L008_KG_Kz";
area8 = "L001_L017_LW_Gr";

couleur = 1;

	if (isCurrentlyFlipped != true) {

        drawRadioBox("◯  2", 1, 9, area1, couleur);	// Katowice
        drawRadioBox("◯  2", 1, 21, area1, couleur);	// Katowice
        drawRadioBox("2 ◯  1", 153, 36, area1, couleur);	// Zawiercie
        drawRadioBox("1 ◯ ", 66, 54, area1, couleur);	// Gora
        drawRadioBox("2 ◯ ", 66, 52, area1, couleur);	// Gora
        drawRadioBox("2 ◯ ", 66, 50, area1, couleur);	// Gora
        drawRadioBox("1 ◯ ", 66, 48, area1, couleur);	// Gora
        drawRadioBox("4 ◯  2", 86, 25, area1, couleur);	// Lazy C
        drawRadioBox("4 ◯  2", 86, 39, area1, couleur);	// Lazy C
        drawRadioBox("◯  4", 76, 46, area1, couleur);	// Koziol		
        drawRadioBox("4 ◯  3", 12, 37, area1, couleur);	// DGHK
        drawRadioBox("3 ◯  2", 21, 44, area1, couleur);	// DGHK
        drawRadioBox("◯  3", 0, 37, area1, couleur);	// Dorota

        drawRadioBox("◯  1", 2, 6, area2, couleur);	// Gora
        drawRadioBox("5 ◯  1", 55, 19, area2, couleur);	// Psary		
        drawRadioBox("◯  5", 23, 15, area2, couleur);	// Kozlow
        drawRadioBox("1 ◯  2", 144, 47, area2, couleur);	// Grodzisk
        drawRadioBox("1 ◯  2", 112, 52, area2, couleur);	// Grodzisk
		
        drawRadioBox("◯  1", 2, 1, area3, couleur);	// Szeligli
        drawRadioBox("1 ◯  2", 40, 6, area3, couleur);	// Koritow
        drawRadioBox("1 ◯  2", 75, 1, area3, couleur);	// Grodzisk
		drawRadioBox("◯  2", 21, 8, area3, couleur);	// Zyrardow
        drawRadioBox("2 ◯ ", 79, 44, area3, couleur);	// Warszawa Wschodnia
		drawRadioBox("5 ◯ ", 79, 51, area3, couleur);	// Warszawa Wschodnia
		drawRadioBox("2 ◯  5", 96, 31, area3, couleur);	// Warszawa Wlochy
        drawRadioBox("5 ◯  2", 130, 31, area3, couleur);	// Warszawa Zachodnia
        drawRadioBox("2 ◯  5", 151, 31, area3, couleur);	// Warszawa Zachodnia

        drawRadioBox("◯  2", 1, 2, area4, couleur);	// Zawodzie
        drawRadioBox("2 ◯ ", 127, 5, area4, couleur);	// DG
        drawRadioBox("2 ◯  5", 41, 24, area4, couleur);	// S. Poludniowy - Dandowka
        drawRadioBox("5 ◯  4", 66, 24, area4, couleur);	// Dandowka - Kazimierz
        drawRadioBox("2 ◯ ", 154, 38, area4, couleur);	// Lazy
        drawRadioBox("2 ◯ ", 154, 47, area4, couleur);	// Lazy
        drawRadioBox("5 ◯  4", 49, 42, area4, couleur);	// Maczki
        drawRadioBox("◯  5", 41, 48, area4, couleur);	// Maczki
        drawRadioBox("5 ◯  3", 63, 53, area4, couleur);	// Dorota
        drawRadioBox("4 ◯  3", 94, 43, area4, couleur);	// DGHK
        drawRadioBox("3 ◯  2", 103, 52, area4, couleur);	// DGHK
        drawRadioBox("5 ◯  3", 67, 31, area4, couleur);	// Juliuzs
        drawRadioBox("3 ◯  4", 76, 31, area4, couleur);	// Juliuzs
        drawRadioBox("◯  5", 7, 30, area4, couleur);	// Tychy
        drawRadioBox("5 ◯  3", 15, 35, area4, couleur);	// KWK Staszic
        drawRadioBox("4 ◯ ", 152, 12, area4, couleur);	// Bukowno
        drawRadioBox("4 ◯ ", 153, 22, area4, couleur);	// DTA R5
		
        drawRadioBox("◯  2", 1, 2, area5, couleur);	// Zawodzie
        drawRadioBox("2 ◯  5", 63, 15, area5, couleur);	// S. Poludniowy - Dandowka
        drawRadioBox("5 ◯  4", 84, 15, area5, couleur);	// Dandowka - Kazimierz
        drawRadioBox("4 ◯  3", 145, 15, area5, couleur);	// Strzemeieszyce - DGHK
        drawRadioBox("4 ◯  5", 72, 49, area5, couleur);	// Kozlow - Sprowa
        drawRadioBox("5 ◯  1", 153, 53, area5, couleur);	// Starzyny - Psary
        drawRadioBox("5 ◯  3", 88, 17, area5, couleur);	// Julius - Dorota
        drawRadioBox("3 ◯  4", 121, 15, area5, couleur);	// Dorota - Wschodnia
        drawRadioBox("3 ◯  4", 121, 25, area5, couleur);	// Dorota - Wschodnia
        drawRadioBox("4 ◯ ", 137, 46, area5, couleur);	// Sedziszow
        drawRadioBox("1 ◯  4", 15, 51, area5, couleur);	// Tunel
        drawRadioBox("◯  5", 22, 20, area5, couleur);	// KJw		
        drawRadioBox("2 ◯ ", 77, 8, area5, couleur);	// Zawiercie		

        drawRadioBox("4 ◯  5", 94, 40, area6, couleur);	// Kozlow - Sprowa
        drawRadioBox("4 ◯ ", 153, 46, area6, couleur);	// Kozlow - Sedziszow		
        drawRadioBox("4 ◯ ", 153, 52, area6, couleur);	// Kozlow - Sedziszow
        drawRadioBox("1 ◯  4", 35, 51, area6, couleur);	// Tunel - Miechow
        drawRadioBox("5 ◯  1", 127, 37, area6, couleur);	// Starzyny - Psary
        drawRadioBox("3 ◯  4", 82, 1, area6, couleur);	// DGHK
        drawRadioBox("2 ◯  5", 26, 5, area6, couleur);	// S. Poludniowy - Dandowka		
        drawRadioBox("5 ◯  4", 46, 7, area6, couleur);	// Dandowka - Kazimierz		
        drawRadioBox("◯  5", 29, 13, area6, couleur);	// KWK Staszic		
        drawRadioBox("5 ◯  3", 57, 13, area6, couleur);	// Julius - Dorota		
        drawRadioBox("5 ◯  4", 68, 16, area6, couleur);	// Maczki
        drawRadioBox("◯  2", 6, 8, area6, couleur);	// SG R52
        drawRadioBox("1 ◯ ", 154, 30, area6, couleur);	// Psary
        drawRadioBox("◯  1", 123, 32, area6, couleur);	// Psary
        drawRadioBox("◯  1", 1, 46, area6, couleur);	// Krakow
		
        drawRadioBox("◯  1", 5, 8, area7, couleur);	// Krakow
        drawRadioBox("1 ◯  4", 86, 52, area7, couleur);	// Tunel - Miechow		
        drawRadioBox("4 ◯  5", 143, 50, area7, couleur);	// Kozlow - Sprowa
        drawRadioBox("◯  4", 65, 44, area7, couleur);	// Wolbrom
        drawRadioBox("4 ◯ ", 150, 47, area7, couleur);	// Kozlow - Sedziszow		
        drawRadioBox("4 ◯ ", 150, 53, area7, couleur);	// Kozlow - Sedziszow

        drawRadioBox("◯  7", 0, 7, area8, couleur);	// Lodz		
        drawRadioBox("◯  7", 0, 20, area8, couleur);	// Lodz
        drawRadioBox("2 ◯ ", 138, 52, area8, couleur);	// Grodzisk
        drawRadioBox("7 ◯  2", 96, 6, area8, couleur);	// Galkowek
        drawRadioBox("7 ◯  2", 104, 15, area8, couleur);	// Zakowice Polu. F
        drawRadioBox("◯  7", 43, 23, area8, couleur);	// Lodz Olechow
        drawRadioBox("◯  4", 77, 37, area8, couleur);	// Beichow
        drawRadioBox("2 ◯  4", 83, 41, area8, couleur);	// Skerniewice
        drawRadioBox("2 ◯  4", 104, 40, area8, couleur);	// Skerniewice
        drawRadioBox("4 ◯  2", 139, 40, area8, couleur);	// Puszcza
        drawRadioBox("2 ◯  4", 131, 49, area8, couleur);	// Puszcza
        drawRadioBox("4 ◯ ", 156, 49, area8, couleur);	// Puszcza
		
		} else {

couleur = 1;

        drawRadioBox("2 ◯ ", 155, 35, area1, couleur);	// Katowice
        drawRadioBox("2 ◯ ", 155, 47, area1, couleur);	// Katowice
        drawRadioBox("◯  1", 90, 2, area1, couleur);	// Gora
        drawRadioBox("◯  2", 90, 4, area1, couleur);	// Gora
        drawRadioBox("◯  2", 90, 6, area1, couleur);	// Gora
        drawRadioBox("◯  1", 90, 8, area1, couleur);	// Gora
        drawRadioBox("2 ◯  4", 68, 28, area1, couleur);	// Lazy C
        drawRadioBox("2 ◯  4", 68, 20, area1, couleur);	// Lazy C
        drawRadioBox("4 ◯ ", 80, 10, area1, couleur);	// Koziol		
        drawRadioBox("3 ◯  4", 142, 19, area1, couleur);	// DGHK
        drawRadioBox("2 ◯  3", 133, 12, area1, couleur);	// DGHK

        drawRadioBox("2 ◯  1", 42, 4, area2, couleur);	// Grodzisk
        drawRadioBox("2 ◯  1", 10, 9, area2, couleur);	// Grodzisk
        drawRadioBox("1 ◯ ", 154, 55, area2, couleur);	// Zawiercie
        drawRadioBox("1 ◯  5", 99, 37, area2, couleur);	// Psary		
        drawRadioBox("5 ◯ ", 140, 38, area2, couleur);	// Psary		
		
        drawRadioBox("1 ◯ ", 154, 54, area3, couleur);	// Szeligli
        drawRadioBox("2 ◯  1", 114, 50, area3, couleur);	// Koritow
        drawRadioBox("2 ◯  1", 79, 55, area3, couleur);	// Grodzisk
		drawRadioBox("2 ◯ ", 141, 45, area3, couleur);	// Zyrardow
        drawRadioBox("◯  5", 77, 5, area3, couleur);	// Warszawa Wschodnia
		drawRadioBox("◯  2", 77, 12, area3, couleur);	// Warszawa Wschodnia
		drawRadioBox("5 ◯  2", 58, 25, area3, couleur);	// Warszawa Wlochy
        drawRadioBox("2 ◯  5", 24, 28, area3, couleur);	// Warszawa Zachodnia
        drawRadioBox("5 ◯  2", 4, 25, area3, couleur);	// Warszawa Zachodnia		

        drawRadioBox("2 ◯ ", 155, 54, area4, couleur);	// Zawodzie
        drawRadioBox("◯  2", 32, 52, area4, couleur);	// DG
        drawRadioBox("2 ◯  5", 105, 34, area4, couleur);	// S. Poludniowy - Dandowka
        drawRadioBox("4 ◯  5", 96, 31, area4, couleur);	// Dandowka - Kazimierz
        drawRadioBox("2 ◯ ", 2, 8, area4, couleur);	// Lazy
        drawRadioBox("2 ◯ ", 2, 17, area4, couleur);	// Lazy
        drawRadioBox("4 ◯  5", 105, 13, area4, couleur);	// Maczki
        drawRadioBox("5 ◯ ", 115, 7, area4, couleur);	// Maczki
        drawRadioBox("3 ◯  5", 87, 2, area4, couleur);	// Dorota
        drawRadioBox("3 ◯  4", 60, 13, area4, couleur);	// DGHK
        drawRadioBox("2 ◯  3", 51, 4, area4, couleur);	// DGHK
        drawRadioBox("3 ◯  5", 87, 28, area4, couleur);	// Juliuzs
        drawRadioBox("4 ◯  3", 78, 27, area4, couleur);	// Juliuzs
        drawRadioBox("5 ◯ ", 149, 23, area4, couleur);	// Tychy
        drawRadioBox("3 ◯  5", 139, 21, area4, couleur);	// KWK Staszic
        drawRadioBox("◯  4", 11, 45, area4, couleur);	// Bukowno
        drawRadioBox("◯  4", 3, 40, area4, couleur);	// DTA R5

        drawRadioBox("2 ◯ ", 155, 54, area5, couleur);	// Zawodzie
        drawRadioBox("5 ◯  2", 90, 43, area5, couleur);	// S. Poludniowy - Dandowka
        drawRadioBox("4 ◯  5", 70, 43, area5, couleur);	// Dandowka - Kazimierz
        drawRadioBox("3 ◯  4", 9, 41, area5, couleur);	// Strzemeieszyce - DGHK
        drawRadioBox("5 ◯  4", 82, 7, area5, couleur);	// Kozlow - Sprowa
        drawRadioBox("1 ◯  5", 1, 2, area5, couleur);	// Starzyny - Psary
        drawRadioBox("3 ◯  5", 65, 34, area5, couleur);	// Julius - Dorota
        drawRadioBox("4 ◯  3", 40, 33, area5, couleur);	// Dorota - Wschodnia
        drawRadioBox("4 ◯  3", 40, 41, area5, couleur);	// Dorota - Wschodnia
        drawRadioBox("◯  4", 26, 11, area5, couleur);	// Sedziszow
        drawRadioBox("4 ◯  1", 139, 4, area5, couleur);	// Tunel
        drawRadioBox("5 ◯ ", 134, 35, area5, couleur);	// KJw		
        drawRadioBox("◯  2", 73, 50, area5, couleur);	// Zawiercie

        drawRadioBox("5 ◯  4", 60, 13, area6, couleur);	// Kozlow - Sprowa
        drawRadioBox("◯  4", 3, 4, area6, couleur);	// Kozlow - Sedziszow		
        drawRadioBox("◯  4", 3, 10, area6, couleur);	// Kozlow - Sedziszow
        drawRadioBox("4 ◯  1", 119, 4, area6, couleur);	// Tunel - Miechow
        drawRadioBox("1 ◯  5", 27, 19, area6, couleur);	// Starzyny - Psary
        drawRadioBox("4 ◯  3", 72, 55, area6, couleur);	// DGHK
        drawRadioBox("5 ◯  2", 128, 51, area6, couleur);	// S. Poludniowy - Dandowka		
        drawRadioBox("4 ◯  5", 101, 52, area6, couleur);	// Dandowka - Kazimierz		
        drawRadioBox("5 ◯ ", 127, 43, area6, couleur);	// KWK Staszic		
        drawRadioBox("3 ◯  5", 96, 43, area6, couleur);	// Julius - Dorota		
        drawRadioBox("4 ◯  5", 86, 39, area6, couleur);	// Maczki
        drawRadioBox("2 ◯ ", 155, 48, area6, couleur);	// SG R52
        drawRadioBox("◯  1", 2, 25, area6, couleur);	// Psary
        drawRadioBox("1 ◯ ", 27, 26, area6, couleur);	// Psary
        drawRadioBox("1 ◯ ", 155, 10, area6, couleur);	// Krakow

        drawRadioBox("1 ◯ ", 151, 48, area7, couleur);	// Krakow
        drawRadioBox("4 ◯  1", 68, 3, area7, couleur);	// Tunel - Miechow		
        drawRadioBox("5 ◯  4", 4, 5, area7, couleur);	// Kozlow - Sprowa
        drawRadioBox("4 ◯ ", 89, 10, area7, couleur);	// Wolbrom
        drawRadioBox("◯  4", 6, 3, area7, couleur);	// Kozlow - Sedziszow		
        drawRadioBox("◯  4", 6, 9, area7, couleur);	// Kozlow - Sedziszow

        drawRadioBox("7 ◯ ", 154, 37, area8, couleur);	// Lodz		
        drawRadioBox("7 ◯ ", 154, 50, area8, couleur);	// Lodz
        drawRadioBox("◯  2", 18, 5, area8, couleur);	// Grodzisk
        drawRadioBox("2 ◯  7", 58, 51, area8, couleur);	// Galkowek
        drawRadioBox("2 ◯  7", 50, 42, area8, couleur);	// Zakowice Polu. F
        drawRadioBox("7 ◯ ", 113, 34, area8, couleur);	// Lodz Olechow
        drawRadioBox("4 ◯ ", 79, 20, area8, couleur);	// Beichow
        drawRadioBox("4 ◯  2", 16, 17, area8, couleur);	// Puszcza
        drawRadioBox("◯  4", 1, 8, area8, couleur);	// Puszcza
		drawRadioBox("4 ◯  2", 24, 8, area8, couleur);	// Puszcza
        drawRadioBox("4 ◯  2", 49, 17, area8, couleur);	// Skierniewice	
        drawRadioBox("4 ◯  2", 71, 16, area8, couleur);	// Skierniewice

		}
				
	}

        let trainsToDraw = getTrainsCoords(data);
		
        drawTrains(trainsToDraw);
		
    }
    if (settings.drawScanLines) {
        drawScanLines();
    }

// Heures et minutes

const time = new Date();

heures = (time.getHours());
minutes = (time.getMinutes());
        if (settings.server != "int1") {
		} else {
			heures = heures - 1;
        }
        if (settings.server != "int3") {
		} else {
			heures = heures - 7;
        }
        if (settings.server != "int6") {
		} else {
			heures = heures + 7;
        }
        if (settings.server != "de3") {
		} else {
			heures = heures - 3;
        }
        if (settings.server != "pl1") {
		} else {
			heures = heures - 6;
        }
        if (settings.server != "pl4") {
		} else {
			heures = heures - 3;
        }
        if (heures < 0) {
			heures = heures + 24;
        }
        if (heures > 23) {
			heures = heures - 24;
        }
        if (heures <= 9) {
			heures = "0" + heures;
        }
        if (minutes <= 9) {
			minutes = "0" + minutes;
        }
n = (heures + ":" + minutes);

x = 78;
y = 0;
	ctx.fillStyle = "#ffffff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = "#000000";

    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
	
}

function getTrainBackground(signalSpeed = 999999, distanceToSignalInFront) {
		if (settings.showNextSignalSpeed)  {
 switch  (settings.showNextSignalSpeed)  {
        case ((distanceToSignalInFront > 5000) || (distanceToSignalInFront == 0)):
			colour5000 = settings.colour3;
			return colour5000;
        case (signalSpeed > 250):
            return "green ";
        case (signalSpeed > 99):
            return "yellow";
        case (signalSpeed > 39):
            return "orange";
        default:
            return "red   ";
    }
	} else {
			colour5000 = settings.colour3;
			return colour5000;
}
}

function getTrainsCoords(data) {
    let trainsToDraw = [];
    let distancesFromTrainsToSignals = [];

	train2 = 0;

    for (let train of data.data) {

		train2 = train2 + 1;
				

				
///        if (train.TrainData.ControlledBySteamID != null) {
///			train[6] = "OUI";
///		} else {
///			train[6] = "NO";
///        }		
	
        if (train.TrainData.SignalInFront != null) {
            let nextSignal = train.TrainData.SignalInFront.split("@")[0];
            if (Object.keys(coordinates[area]).includes(nextSignal)) {
                let trainBackgroundColour = getTrainBackground(train.TrainData.SignalInFrontSpeed, train.TrainData.DistanceToSignalInFront);

                trainsToDraw.push([
                    train.TrainNoLocal,
                    ...coordinates[area][nextSignal],
                    train.TrainData.Velocity,
                    signalDirections[area][nextSignal],
                    trainBackgroundColour,
					
                ]);

                distancesFromTrainsToSignals.push({
                    signalName: train.TrainData.SignalInFront.split("@")[0],
                    distance: train.TrainData.DistanceToSignalInFront
                });

            }

        }
		
		
		train1[train2] = train2;
		train5[train2] = train.TrainNoLocal;
		train6[train2] = train.Type;
		train7[train2] = train.Vehicles[0];
		train9[train2] = train.TrainName;
		train11[train2] = train.StartStation;
		train12[train2] = train.EndStation;
	
		loco1 = train7[train2].indexOf("/"); // position du /
		loco2 = train7[train2].substring(loco1 + 1);
		loco3 = train7[train2].indexOf("-"); // position du -
		train8[train2] = train7[train2].substring(loco1 + 1, loco3); // C'est le type de loco		
        if (train8[train2].substring(0,5) != "E6ACT") {
        } else  {
		train8[train2] = "E6ACT"
        }
/// VMax des trains
		typeTrain = train.TrainName.substring(0, 3);
		train10[train2] = typeTrain;
console.log("1585 - train.TrainName : ", train2, train.TrainName, " - typeTrain : ", typeTrain, train5[train2], train6[train2], train7[train2], train8[train2], train9[train2]);
	vmax = vmaxTrain(typeTrain);
	train9[train2] = vmax;
//console.log("1589 - vmax : ", vmax, " - train9[train2] : ", train9[train2]);

		Origine = train11[train2].substring(0, 8);
		if (Origine == "KATOWICE") {
			Origine = "KWK Staszic";
        }
		if (Origine == "Sosnowie") {
			Origine = "S.Maczki";
        }
		if (Origine == "Bielsko-") {
			Origine = "Bielsko";
        }
		train11[train2] = Origine;
		Destination = train12[train2].substring(0, 8);
		train12[train2] = Destination;
		InMap = EntryMap(Origine);
		train13[train2] = InMap;
//		ExitfromMap = ExitMap(Destination);				
//		trainOutMap[train2] = ExitfromMap;
		ExitByNum = ExitNoLocal(train5[train2]);
		train14[train2] = ExitByNum;
console.log("1616 - Origine : ", train2, Origine, train11[train2], Destination, train12[train2], train13[train2], train14[train2], ExitByNum);


/// Attention : VMax des locos et pas des trains
///if ((typeof train.Vehicles[1] != "undefined") || (typeTrain != "LTE")) {
if (typeof train.Vehicles[1] != "undefined") {
        } else  {
//console.log("HLP : train.TrainName : ", train.TrainName, " - typeTrain : ", typeTrain, "train.Vehicles[1] : ", train.Vehicles[1]);
loco6 = train8[train2];
//console.log("1632 - loco4 : ", loco4, " - loco6 : ", loco6);
loco5 = locoHLP(loco6);
console.log("1634 - loco5 : ", loco5, " - loco6 : ", loco6, "train9[train2] : ", train9[train2]);
	if (loco5 != "no")  {
		train8[train2] = loco5;
		loco4 = train9[train2];
		train9[train2] = "HLP " + loco4;
    } else  {
    }
        }

/// Attention : VMax des locos et pas des trains
        console.log("1645 - Train : ", train2, train5[train2], " - Loco : ", train7[train2], " - train8[train2] : ", train8[train2]);
    }

    // Remove second train in same section
    // Btw, if the second train in the same section appears first, it's not removed - but it doesn't matter, since the other train, closer to the end of the section, will be drawn on top of it.
    let distancesFromSIGNALStoTRAINS = {};
    for (let i in distancesFromSIGNALStoTRAINS) {
        if (distancesFromSIGNALStoTRAINS[distancesFromSignalsToTrains[i].signalName] == undefined) {
            distancesFromSIGNALStoTRAINS[distancesFromSignalsToTrains[i].signalName] = distancesFromSignalsToTrains[i].distance;
        } else if (distancesFromSIGNALStoTRAINS[distancesFromSignalsToTrains[i].signalName] < distancesFromSignalsToTrains[i].distance) {
            trainsToDraw[i] = [null];
        }
    }

    let logSignalsWithMultipleTrains = [];
    for (let i in trainsToDraw) {

        if (trainsToDraw[i][0] === null) {
            logSignalsWithMultipleTrains.push(distancesFromSignalsToTrains[i].signalName);
        }
    }
    if (logSignalsWithMultipleTrains.length) {
//        console.log("Some sections have more than one train on them: ", logSignalsWithMultipleTrains);
    }

    return trainsToDraw;
}

////*******************************
function vmaxTrain(typeTrain)  {
//console.log("1710 - typeTrain : <", typeTrain, ">");
switch (typeTrain)  {
	case "TSE":
		vmax = "50";
		break;
	case "ZUE":
	case "ZXE":
		vmax = "75";
		break;
	case "TKE":
	case "TME":
	case "TRE":
		vmax = "80";
		break;
	case "LPE":
	case "LPP":
	case "PWE":
	case "PWJ":
	case "PWP":
	case "PXE":
	case "PXJ":
	case "TDE":
	case "TNE":
	case "TPG":
		vmax = "100";
		break;
	case "IR":
	case "LTE":
	case "R":
	case "RE1":
		vmax = "110";
		break;
	case "AMJ":
	case "MAJ":
	case "MOE":
	case "MOJ":
	case "MPE":
	case "MPJ":
	case "RAE":
	case "RAJ":
	case "ROE":
	case "ROJ":
	case "RPE":
	case "RPJ":
	case "R1":
	case "R3":
	case "S1":
	case "S41":
	case "TLE":
	case "TLK":
		vmax = "120";
		break;
	case "ECE":
	case "ECJ":
	case "EIC":
	case "EIE":
	case "IC":
	case "MHE":
		vmax = "140";
		break;
	case "EIJ":
	case "PWJ":
		vmax = "160";
		break;
	case "EIP":
		vmax = "200";
		break;
	default:
		vmax = "xxx";
}	
		return vmax;
}
/////****************************

function locoHLP(loco)  {

switch (loco)  {
	case "E186":
		loco5 = "E186 HLP";
		break;
	case "E6ACT":
		loco5 = "E6ACT HLP";
		break;
	case "EP07":
		loco5 = "EP07 HLP";
		break;
	case "EP08":
		loco5 = "EP08 HLP";
		break;
	case "EU07":
		loco5 = "EU07 HLP";
		break;
	case "ET22":
		loco5 = "ET22 HLP";
		break;
	case "ET25":
		loco5 = "ET25 HLP";
		break;	
	case "EN57":
		loco5 = "no";
		break;
	case "EN71":
		loco5 = "no";
		break;
	case "EN76":
		loco5 = "no";
		break;
	case "EN96":
		loco5 = "no";
		break;
	case "ED250":
		loco5 = "no";
		break;
	default:
		loco5 = "no";	
}	
	return loco5
}
/////****************************

function EntryMap(Station)  {

switch (Station)  {
	case "Warszawa":
		Entry = "Warszawa"; // OK
		break;
	case "Katowice":
		Entry = "Katowice"; // OK
		break;
	case "KWK Staszic":
		Entry = "KWK Staszic" // OK
		break;
	case "Bielsko":
		Entry = "Kato.Brynów"; // OK
		break;
	case "Kraków P":
		Entry = "Kraków Przedm"; // OK
		break
	case "Kraków G":
		Entry = "Kraków Główny"; // OK
		break
	case "Kraków N":
		Entry = "Dłubnia"; // OK
		break
	case "Kraków O":
		Entry = "Kraków Olsza"; // OK
		break
	case "Kraków M":
		if (globalThis_area0 == "L001_KO_Zw")  {
			Entry = "S.Maczki";
			break;
		}
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Entry = "Rokiciny";
			break;
		}
;
	case "Gdynia G":
	case "Gdynia P":
		Entry = "Warszawa"; // OK
		break;
	case "Kielce":
		Entry = "Sędziszów"; // OK
		break;
	case "Bohumin":
		Entry = "Kato.Brynów"; // OK
		break;
	case "Tychy":
	case "Tychy Lo":
		Entry = "Kato.Brynów"; // OK
		break;
	case "Tychy Fi":
	case "Tychy Lo":
		Entry = "Staszic"; // OK
		break;
	case "Gliwice":
		Entry = "Kato.Tow KTC"; // OK
		break;	
	case "Lublin":
		Entry = "Czarnca";  // OK
		break;
	case "Skarżysk":
		Entry = "Słotwiny"; // OK
		break;
	case "Zielonka":
		Entry = "Warszawa"; // OK
		break;
	case "Sitkówka":
		Entry = "Sędziszów"; // OK
		break;
	case "Ożarów M":
		Entry = "Sędziszów"; // OK
		break;
	case "Łódź Cho":
		Entry = "Łódź Chojny"; // OK
		break;
	case "Łódź Chojny":
		Entry = "Łódź Chojny"; // OK
		break;
	case "Łódź Fabryczna":
		Entry = "Łódź Fabryc."; // OK
		break;
	case "Łódź Fab":
		Entry = "Łódź Fabryc."; // OK
		break;
	case "Chorzew ":
		Entry = "Łódź Chojny";  // OK
		break;
	case "Jędrzejó":
		Entry = "Sędziszów"; // OK
		break;
	case "Myszków":
		Entry = "Myszków"; // OK
		break;
	case "Częstoch":
		Entry = "Myszków"; // OK
		break;
	case "Wrocław ":
		Entry = "Łódź Chojny";  // OK
		break;
	case "Sosnowie":
		Entry = "S.Maczki"; // OK
		break;
	case "S.Maczki":
		Entry = "S.Maczki"; // OK
		break;
	case "Jaworzno":
		Entry = "S.Maczki";  // OK
		break;
	case "Brzesko ":
		Entry = "Kraków"; // OK
		break;
	case "Mszczonó":
		Entry = "Marków"; // OK
		break;
	case "Dąbrowa ":
		Entry = "Dąbrowa "; // OK
		break;
	case "Nałęczów":
		Entry = "Idzikowice"; // OK
		break;
	case "Bełchów":
		Entry = "Bełchów"; // OK
		break;
	case "Zakopane":
		Entry = "Kraków"; // OK
		break;
	case "Poznań G":
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Entry = "Łódź Chojny";
			break;
		}
		if (globalThis_area0 == "L001_KO_Zw")  {
			Entry = "Myszków";
			break;
		}
	case "Wrocław ":
		Entry = "Myszków"; // OK
		break;
	case "Częstoch":
		Entry = "Myszków"; // OK
		break;
	case "Puszcza ":
		Entry = "Puszcza"; // OK
		break;
	case "Małkinia":
		Entry = "Marków";  // OK
		break;
	case "Radomsko":
		Entry = "Rokiciny"; // OK
		break;
	case "Szczecin":
		Entry = "Łódź Chojny";  // OK
		break;
	case "Małaszew":
		Entry = "Łódź Chojny";  // OK
		break;
	case "Henryków":
		Entry = "Łódź Chojny";  // OK
		break;
	case "Łowicz G":
		Entry = "Skierniewice"; // OK
		break;
	case "Białysto":
		Entry = "Warszawa"; // OK
		break;
	case "Piława G":
		Entry = "Szeligi"; // OK
		break;
	case "Puławy":
		Entry = "Idzikowice"; // OK
		break;
	case "Radom":
		Entry = "Idzikowice"; // OK
		break;
	case "Jelenia ":
		Entry = "Żelislawice"; // OK
		break;
	case "Trzebini":
		Entry = "Myszków"; // OK
		break;
	case "Gliwice ":
		Entry = "Kato.Tow KTC"; // OK
		break;
	case "Tomaszów":
		Entry = "Tomaszów"; // OK
		break;		
	default:
		Entry = "??" + Station;	
}	
	return Entry
}

function ExitNoLocal(TrainNoLocal)  {

// *** Speed trains

if (TrainNoLocal.length == 4)  {
train3 = TrainNoLocal.substring(0, 3);
 console.log("1923 : ", TrainNoLocal, train3);
switch (train3)  {
	case "160":
	case "161":
		Exit = "Żelisławice";
		break;
	case "164":
		Exit = "Łódź Chojny";
		break;
	case "166":
		Exit = "Rokiciny";
		break;
	default:
		Exit = "!! " + train3		
}
 console.log("1934 : ", TrainNoLocal, train3, Exit);
train3 = TrainNoLocal.substring(0, 2);
switch (train3)  {
	case "37":
		if (globalThis_area0 == "L001_KO_Zw")  {
			Exit = "Myszków";
			break;
		}
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Exit = "Łódź Chojny";
			break;
		}
	case "73":
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Exit = "Rokiciny";
			break;
		}
		if (globalThis_area0 == "L001_KO_Zw")  {
			Exit = "S.Maczki";
			break;
		}
	case "31":
	case "41":
	case "45":
	case "61":
	case "81":
	case "91":
		Exit = "Warszawa";
		break;
	case "13":
		Exit = "Kraków";
		break;
	case "14":
		Exit = "Kato.Brynów";
		break;
	case "19":
		Exit = "Łódź Fabryc.";
		break;
	case "54":
		Exit = "Kato.Tow KTC";
		break;
	case "18":
		Exit = "Warszawa Gol.";
		break;
	case "16":
		break;
	default:
		Exit = "!! " + train3		
}
}

//*** Passengers

if (TrainNoLocal.length == 5)  {
switch (TrainNoLocal)  {
	case "42206":
		Exit = "Sędziszów";
	break;
}
//**** dont 4 chiffres !!!
train3 = TrainNoLocal.substring(0, 4);
 console.log("1972 : ", TrainNoLocal, train3);
switch (train3)  {
	case "1615":
	case "1616":
	case "1617":
	case "1618":
	case "1620":
		Exit = "Żelisławice";
		break;
	case "1610":
	case "1611":
		Exit = "Łódź Chojny";
		break;
	case "1613":
	case "1614":
	case "9320":
	case "9321":
	case "9322":
	case "9323":
		Exit = "Rokiciny";
		break;
	case "4010":
	case "4011":
	case "4012":
	case "4013":
	case "4014":
		Exit = "Kato.Brynów";
		break;
	case "4060":
	case "4061":
	case "4062":
	case "4063":
		Exit = "Kato.Tow KTC";
		break;
	case "4015":
	case "4016":
	case "4017":
	case "4018":
	case "4019":
	case "4065":
	case "4066":
	case "4067":
	case "4068":
		Exit = "Myszków";
		break;
	case "1110":
	case "1111":
	case "9325":
	case "9326":
	case "9327":
	case "9328":
		Exit = "Łódź Fabryc.";
		break;
	case "1115":
	case "1116":
	case "1915":
		Exit = "Warszawa";
		break;
	case "4210":
	case "4211":
	case "4220":
		Exit = "Czarnca";
		break;
	case "4215":
	case "4216":
		Exit = "Sędziszów";
		break;
	default:
		Exit = "!! " + train3
}
train3 = TrainNoLocal.substring(0, 3);
 console.log("2021 : ", TrainNoLocal, train3);
switch (train3)  {
	case "741":
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Exit = "Rokiciny";
			break;
		}
		if (globalThis_area0 == "L001_KO_Zw")  {
			Exit = "Kato.Brynów";
			break;
		}
	case "471":
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Exit = "Łódź Chojny";
			break;
		}
		if (globalThis_area0 == "L001_KO_Zw")  {
			Exit = "Myszków";
			break;
		}		
	case "231":
	case "531":
	case "532":
	case "239":
		Exit = "Kraków";
		break;
	case "351":
	case "352":
	case "450":
	case "611":
	case "612":
	case "911":
	case "917":
	case "918":
	case "919":
		Exit = "Warszawa";
		break;
	case "197":
		Exit = "Warszawa Gol.";
		break;
	case "191":
	case "198":
	case "199":
		Exit = "Bełchów";
		break;
	case "241":
	case "242":
		Exit = "Kato.Tow KTC";
		break;
	case "249":
	case "540":
		Exit = "Kato.Brynów";
		break;
	case "321":
	case "329":
	case "429":
		Exit = "Sędziszów";
		break;		
	case "105":
	case "212":
		Exit = "Łódź Fabryc.";
		break;		
	case "122":
		Exit = "Mikołajów";
		break;
	case "115":
		Exit = "Puszcza";
		break;
	case "111":
	case "161":
	case "162":
	case "191":
	case "401":
	case "406":
	case "421":
	case "422":
	case "4210":
	case "4211":
	case "4220":
	case "1910":
	case "1915":
	case "741":
	case "932":
		break;		
	default:
		Exit = "!! " + train3
}
// console.log("2084 : ", TrainNoLocal, train3, Exit);
}

//*** Fret

if (TrainNoLocal.length == 6)  {
//**** dont 4 chiffres !!!
train3 = TrainNoLocal.substring(0, 6); 
switch (train3)  {
	case "335001":
	case "335003":
	case "335005":
	case "335007":
	case "335009":
	case "3350011":
	case "3350013":
	case "3350015":
	case "3350017":
	case "3350019":
	case "3350021":
	case "3350023":
			Exit = "Kraków Olsza";
			break;
	case "335000":
	case "335002":
	case "335004":
	case "335006":
	case "335008":
	case "3350010":
	case "3350012":
	case "3350014":
	case "3350016":
	case "3350018":
	case "3350020":
	case "3350022":
	case "336000":
	case "336002":
	case "336004":
	case "336006":
	case "336008":
	case "3360010":
	case "3360012":
	case "3360014":
	case "3360016":
	case "3360018":
			Exit = "Dłubnia";
			break;
	case "336001":
	case "336003":
	case "336005":
	case "336007":
	case "336009":
	case "3360011":
	case "3360013":
	case "3360015":
	case "3360017":
	case "3360019":
	case "3360021":
	case "3360023":
			Exit = "Kraków Główny";
			break;
}
train3 = TrainNoLocal.substring(0, 4); 
switch (train3)  {
	case "4120":
		if (globalThis_area0 == "L001_L017_LW_Gr")  {
			Exit = "Łódź Olechów";
			break;
		}		
		if (globalThis_area0 == "L004_Zw_Gr")  {
			Exit = "Idzikowice";
			break;
        }
	case "4121":
			Exit = "Marków";
			break;
	case "1440":
		Exit = "Rokiciny";
		break;
	case "1442":
		Exit = "Staszic";
		break;
	case "1443":
		Exit = "Bukowno";
		break;
	case "4438":
		Exit = "D.G. Tow";
		break;
	case "4439":
		Exit = " Myszków";
		break;
	default:
		Exit = "!! " + train3		
}
train3 = TrainNoLocal.substring(0, 3);
switch (train3)  {		
	case "234":
		Exit = "Kraków Olsza";
		break;
	case "132":
	case "335":
	case "336":
		Exit = "Dłubnia";
		break;
	case "142":
		Exit = "D.G. Tow";
		break;
	case "242":
	case "245":
		Exit = "Kato.Tow KTC";
		break;
	case "125":
		Exit = "Mikołajów";
		break;
	case "215":
		Exit = "Bełchów";
		break;
	case "324":
	case "424":
		Exit = "Sędziszów";
		break;
	case "344":
		Exit = "Koniecpol";
		break;
	case "444":
		Exit = "S.Maczki";
		break;
	case "445":
	case "464":
	case "649":
		Exit = "Myszków";
		break;
	case "441":
		Exit = "KWK Staszic";
		break;
	case "192":
	case "194":
		Exit = "Łódź Olechów";
		break;
	case "912":
	case "914":
		Exit = "Warszawa Gł.Tow";
		break;
	case "422":
	case "425":
		Exit = "Czarnca";
		break;
	case "614":
		Exit = "Puszcza";
		break;
	case "441":
	case "446":
		Exit = "Staszic";
		break;
	case "144":
	case "443":
	case "412":
	case "4120":
	case "4121":
		break;
	default:
		Exit = "!! " + train3		
}	
}	
console.log("2160 : Exit : ", Exit);
	return Exit
}
/////****************************

function getstationCoords(stationdata) {
	
    let stationToDraw = [];
///    let distancesFromTrainsToSignals = [];

	station2 = 0;

    for (let station of stationdata.data) {

		station2 = station2 + 1;	

                stationToDraw.push([
                    station.Name,
                    station.Prefix,
                    station.DispatchedBy,
					station.MainImageURL,
                ]);
				
    }
	findnbStationUsers(stationdata);
    return stationToDraw;
}

function logSignalNames(data) {
    for (let train of data.data) {
        if (train.TrainData.SignalInFront != null) {
            if (loggedSignalNames[train.TrainNoLocal] == undefined) {
                loggedSignalNames[train.TrainNoLocal] = [];
            }
            let nextSignal = train.TrainData.SignalInFront.split("@")[0];
            if (loggedSignalNames[train.TrainNoLocal][loggedSignalNames[train.TrainNoLocal].length - 1] != nextSignal) {
                loggedSignalNames[train.TrainNoLocal].push(nextSignal);
            }
        }
    }
}

async function debugNextSignal(trainNo) {
    const data = await getDataFromServer();
    for (let train of data.data) {
        if (train.TrainNoLocal == trainNo) {
            return train.TrainData.SignalInFront.split("@")[0];
        }
    }
    return null;
}

function drawSettings() {
    function writeCoolSettingName(settingName, isSelected) {
        if (settingName === true) {
            settingName = "YES   ";
        } else if (settingName === false) {
            settingName = "NO   ";
        }
        settingName = settingName.toUpperCase();
        settingName = settingName.substring(0, 6);
        for (let i = 6; i > settingName.length; i--) {
            settingName = settingName += " ";
        }
        settingName = (isSelected ? "◄ " : "  ") + settingName + (isSelected ? " ►" : "  ");
        return settingName;
    }
    for (let id of Object.keys(settings)) {
		
        if (coordinates.Settings[id] != undefined) {
           drawNumberBox(writeCoolSettingName(settings[id], id == selectedSetting), ...coordinates.Settings[id], 0, 0, null, false, id == selectedSetting, 8);
        }
///   }
}
}

function drawKeysUsed(area) {

    ctx.font = "normal " + textSize + "px monospace";
    ctx.textBaseline = "top";

    ctx.fillStyle = coloursPalette[settings.colour][0];
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.fillStyle = coloursPalette[settings.colour][1];
    let text = layouts[area];
	
    for (let row in text) {
        for (let char in text[row].split("'")[0]) {		
		ctx.fillStyle = coloursPalette[settings.colour][1];		
    if (settings.drawScanLines) {
        drawScanLines();
    }
    }
}
}

function drawTrains(trainsToDraw) {

	train3 = 2;
    if (trainsToDraw.length)
        for (let train0 of trainsToDraw) {

// ***  Numéros de train (sans couleurs)
				drawNumberBox(...train0);

//            if (train[0] = "xxxxxx")  {
//                drawNumberBox(...createSpeedBoxFromTrain(train), true, true, 3);
//		}

            if (settings.showTrainSpeed === true) {
//  *** Vitesses et Numéros de train (avec couleurs)


		ii = 1;
        for (let i = 0; i < 200; i++) {
			if (train5[i] != train0[0]) {
		train3 = 1;
			} else {
		ii = i;
        }				
		}
				train3 = ii;

////
console.log("1853 - train3 : ", train3, "train8[ii] : ", train8[ii], train5[ii], train0[0]);  // pour le type de loco
//console.log("1854 : ", train3, train8[ii], train5[ii], train0[0]);   // pour le type de loco

			show = "";
		if (globalThis.Key == "v")  {
			show = "showSpeed";
        } else   {
		}
		if (globalThis.Key == "l")  {
			show = "showLoco";
        } else   {
		}
		if (globalThis.Key == "t")  {
			show = "showTypeTrain";
        } else   {
		}
		if (globalThis.Key == "o")  {
			show = "showOrigine";
        } else   {
		}
		if (globalThis.Key == "d")  {
			show = "showDestination";
        } else   {
		}
		if (globalThis.Key == "i")  {
			show = "showInMap";
        } else   {
		}
		if (globalThis.Key == "x")  {
			show = "showExitMap";
        } else   {
		}
	console.log("2046 : ", globalThis.Key, show);		
			switch (show)  {
			case "showLoco":
					drawNumberBox5(...createSpeedBoxFromTrain5(train0, isSpeedBox = false, train3), true, true, 8);	
					break;
			case "showSpeed":
					drawNumberBox6(...createSpeedBoxFromTrain6(train0, isSpeedBox = false, train3), true, true, 6);
					break;
			case "showTypeTrain":			
					drawNumberBox7(...createSpeedBoxFromTrain7(train0, isSpeedBox = false, train3), true, true, 6);
					break;
			case "showOrigine":
			case "showDestination":
			case "showInMap":
			case "showExitMap":
					drawNumberBox8(...createSpeedBoxFromTrain8(train0, isSpeedBox = false, train3), true, true, 10);
					break;
			default:
          if (train0[0] != "xxxxxx")  {
					drawNumberBox4(...createSpeedBoxFromTrain(train0, isSpeedBox = false, train3), true, true, 6);	
			}

			}
	}
}	
 		
    function writeCoolSettingName(settingName, isSelected) {
        if (settingName === true) {
            settingName = "YES   ";
        } else if (settingName === false) {
            settingName = "NO   ";
        }
        settingName = settingName.toUpperCase();
        settingName = settingName.substring(0, 6);
        for (let i = 6; i > settingName.length; i--) {
            settingName = settingName += " ";
        }
        settingName = (isSelected ? "◄ " : "  ") + settingName + (isSelected ? " ►" : "  ");
        return settingName;
    }
    for (let id of Object.keys(settings)) {


	if ((settings[id] != "white ") && (settings[id] != "green ") && (settings[id] != "red   ") && (settings[id] != "pink  ") && (settings[id] != "pink2 ") && (settings[id] != "blue  ") && (settings[id] != "orange") && (settings[id] != "yellow") && (settings[id] != true) && (settings[id] != false)) {	
		
        if (coordinates.Settings[id] != undefined) {
            drawNumberBox(writeCoolSettingName(settings[id], id == selectedSetting), ...coordinates.Settings[id], 0, 0, null, false, id == selectedSetting, 8);
        }
   }
 
}	
	
}

function drawstation(stationToDraw) {
    trainBackgroundColour = settings.colour;
	
/// STATIONS ...

area1 = "L001_KO_Zw";
area2 = "L004_Zw_Gr";
area3 = "L001_Zy_WSD";
area4 = "L171_L131";
area5 = "L062_L171_SG_Tl";
area6 = "L062_SPł_Sd";
area7 = "L008_KG_Kz";
area8 = "L001_L017_LW_Gr";

       for (let station of stationToDraw) {
		
	
//         0           station.Name,
//         1          station.Prefix,
//         2          station.DispatchedBy.SteamId,	

globalThis.userstation = "neant"

	globalThis.station0 = station[0];
	globalThis.station1 = station[1];
	globalThis.station2 = station[2];
	globalThis.station3 = station[3];

drawstation2mots(area1, "L001 : Katowice - Zawiercie", 1, 0, 27)
drawstationuser(area1, "Katowice", "KO", 22, 21, 8)
drawstation2mots(area1, "Ko Tow.KTC", 3, 10, 10)
drawstationuser(area1, "K.Zawodzie", "KZ", 55, 13, 10)
drawstationuser(area1, "Sosnowiec Główny", "SG", 93, 13, 16)
drawstationuser(area1, "Będzin", "B", 124, 14, 6)
drawstationuser(area1, "Dąbrowa Górnicza", "DG", 141, 17, 16)
drawstationuser(area1, "S.Południowy", "Spł1", 96, 23, 13)
drawstationuser(area1, "DGHK", "DGHK", 16, 44, 4)
drawstationuser(area1, "Dąbrowa Górnicza Ząbkowice", "DZ", 30, 45, 26)
drawstationuser(area1, "Łazy ŁC", "ŁC", 90, 38, 6)
drawstationuser(area1, "Łazy", "LB", 105, 38, 4)
drawstationuser(area1, "Łazy ŁA", "ŁA", 121, 53, 6)
drawstationuser(area1, "Zawiercie", "Zw", 144, 45, 9)
drawstation2mots(area1, "S.Dańdówka", 112, 18, 10)
drawstation2mots(area1, "D.G. Tow", 96, 50, 8)
drawstation2mots(area1, "D.G. Tow", 89, 44, 8)

drawstation2mots(area2, "L004 : Zawiercie - Grodzisk Mazowiecki", 1, 0, 38)
drawstationuser(area2, "Góra Włodowska", "GW", 62, 8, 14)
drawstationuser(area2, "Psary", "Ps", 67, 19, 5)
drawstationuser(area2, "<< Starzyny", "Str", 38, 19, 11)
drawstationuser(area2, "Sprowa >>", "Str", 27, 19, 9)
drawstationuser(area2, "Knapówka", "Kn", 99, 16, 8)
drawstationuser(area2, "Włoszczowa Północ", "WP", 130, 17, 17)
drawstationuser(area2, "Opoczno Południe", "Op", 56, 36, 16)
drawstationuser(area2, "<< Olszamowice", "Ol", 89, 27, 14)
drawstationuser(area2, "Pilichowice >>", "Ol", 3, 34, 14)
drawstationuser(area2, "Idzikowice", "Id", 112, 25, 10)
drawstationuser(area2, "Strzałki >>", "St", 54, 38, 11)
drawstationuser(area2, "<< Biała Rawska", "St", 120, 45, 15)
drawstationuser(area2, "Szeligi", "Se", 46, 56, 7)
drawstationuser(area2, "Korytów", "Kr", 92, 54, 7)
drawstation2mots(area2, "Grodzisk M. --->", 142, 53, 11)

drawstation2mots(area3, "L001 : Korytów-Żyrardów - Warszawa ", 1, 0, 35)
drawstationuser(area3, "Grodzisk Mazowiecki", "Gr", 86, 12, 19)
drawstationuser(area3, "Pruszków >>", "Pr", 21, 29, 11)
drawstationuser(area3, "<< Józefinów", "Pr", 50, 31, 12)
drawstation2mots(area3, "W.Goląbki", 46, 27, 9)
drawstation2mots(area3, "Warszawa Gł.Tow.", 69, 15, 16)
drawstationuser(area3, "Korytów", "Kr", 27, 8, 7)
drawstation2mots(area3, "W.Targówek", 110, 32, 10)
drawstation2mots(area3, "W.Grochów", 131, 55, 9)
drawstation2mots(area3, "W.Olszynka", 145, 53, 10)
drawstationuser(area3, "Żyrardów", "Zr", 20, 12, 8)
drawstationuser(area3, "Warszawa Włochy", "Wl", 79, 31, 15)

drawstation2mots(area4, "L171 - L131", 1, 0, 11)
drawstationuser(area4, "K.Zawodzie", "KZ", 2, 3, 10)
drawstationuser(area4, "Sosnowiec Główny", "SG", 44, 10, 16)
drawstationuser(area4, "Będzin", "B", 76, 3, 6)
drawstationuser(area4, "Dąbrowa Górnicza", "DG", 109, 3, 16)
//drawstation2mots(area4, "S.Południowy ", 43, 21, 14)
drawstationuser(area4, "S.Południowy", "Spł1", 43, 21, 13)
drawstationuser(area4, "Juliusz", "Ju", 62, 33, 7)
drawstationuser(area4, "Dorota", "Dra", 71, 53, 6)
drawstationuser(area4, "DGHK", "DGHK", 100, 51, 4)
drawstationuser(area4, "Dąbrowa Górnicza Ząbkowice", "DZ", 111, 53, 26)
//drawstation2mots(area4, "S.Kazimierz", 72, 22, 12)
drawstationuser(area4, "S.Kazimierz", "SKz", 72, 22, 12)
drawstationuser(area4, "Sławków", "Sl", 130, 8, 7)
drawstationuser(area4, "Dąbrowa Górnicza Wschodnia", "DW", 103, 30, 26)
drawstation2mots(area4, "S.Dańdówka", 46, 39, 10)
drawstation2mots(area4, "D.G. Tow", 134, 19, 8)
drawstation2mots(area4, "D.G. Tow", 143, 25, 8)

drawstation2mots(area5, "L062 - L171 : Zawodzie - Sedziszow", 1, 0, 34)
drawstationuser(area5, "K.Zawodzie", "KZ", 2, 3, 10)
drawstationuser(area5, "S.Główny", "SG", 43, 10, 8)
drawstationuser(area5, "Będzin", "B", 67, 3, 6)
drawstationuser(area5, "D.G.Wschodnia", "DW", 140, 1, 13)
drawstationuser(area5, "S.Południowy", "Spł1", 48, 19, 12)
drawstationuser(area5, "Dorota", "Dra", 111, 25, 6)
drawstationuser(area5, "S.Kazimierz", "SKz", 94, 1, 11)
drawstationuser(area5, "JU", "Ju", 88, 21, 2)
drawstationuser(area5, "DGHK", "DGHK", 150, 23, 4)
drawstationuser(area5, "Sławków", "Sl", 14, 38, 7)
drawstationuser(area5, "Bukowno", "Bo", 37, 40, 7)
drawstationuser(area5, "Tunel", "Tl", 24, 53, 5)
drawstationuser(area5, "Kozłów >>", "Kz", 62, 55, 9)
drawstationuser(area5, "<< Klimontów", "Kz", 83, 49, 12)
drawstationuser(area5, "<< Starzyny", "Str", 136, 56, 11)
drawstationuser(area5, "Sprowa >>", "Str", 127, 54, 9)
drawstation2mots(area5, "S.Dańdówka", 72, 27, 10)
drawstation2mots(area5, "D.G.Poludniowa", 131, 25, 14)

drawstation2mots(area6, "L062 : S.Południowy - Sędziszów-Psary-Koniecpol (adapted from Besentv)", 1, 0, 74)
drawstationuser(area6, "S.Południowy", "Spł1", 10, 11, 13)
drawstationuser(area6, "Julius", "Ju", 50, 13, 6)
drawstationuser(area6, "S.Kazimierz", "SKz", 64, 2, 12)
drawstationuser(area6, "D.G.Wschodnia", "DW", 106, 2, 14)
drawstationuser(area6, "Sławków", "Sl", 134, 11, 7)
drawstationuser(area6, "Bukowno", "Bo", 16, 32, 7)
drawstationuser(area6, "Tunel", "Tl", 44, 53, 5)
drawstationuser(area6, "Kozłów >>", "Kz", 81, 55, 9)
drawstationuser(area6, "<< Klimontów", "Kz", 98, 49, 12)
drawstationuser(area6, "<< Starzyny", "Str", 109, 37, 11)
drawstationuser(area6, "Sprowa >>", "Str", 102, 33, 9)
drawstationuser(area6, "Psary", "Ps", 136, 28, 5)
drawstation2mots(area6, "S.Główny", 5, 2, 8)
drawstation2mots(area6, "<-Dorota", 102, 11, 8)
drawstation2mots(area6, "D.G.Strzemieszyce", 84, 13, 17)
drawstation2mots(area6, "S.Dańdówka", 34, 4, 10)
drawstation2mots(area6, "S.Porąbka", 49, 5, 9)

drawstation2mots(area7, "L008 : Kraków - Kozłów", 1, 0, 22)
drawstationuser(area7, "Kraków", "KPm", 61, 25, 6)
drawstationuser(area7, "Przedmieście", "KPm", 58, 26, 12)
drawstationuser(area7, "Kraków Batowice", "BT",76, 26, 15)
drawstationuser(area7, "Raciborowice", "Rc", 99, 21, 12)
drawstationuser(area7, "Zastów", "Zs", 116, 22, 6)
drawstationuser(area7, "Niedźwiedź", "Nd", 58, 38, 10)
drawstationuser(area7, "Słomniki", "Sm", 92, 40, 8)
drawstationuser(area7, "Miechów", "Mi", 41, 54, 7)
drawstationuser(area7, "Tunel", "Tl", 95, 54, 5)
drawstationuser(area7, "Kozłów", "Kz", 134, 56, 6)

drawstation2mots(area8, "L001 - L017 : Łódź - Żyrardów (adapted from Besentv)", 1, 0, 52)
drawstationuser(area8, "Łódź Widzew", "LW", 15, 21, 11)
drawstationuser(area8, "Łódź >>", "G", 42, 9, 7)
drawstationuser(area8, "Andrzejów", "G", 41, 10, 9)
drawstationuser(area8, "<< Galkówek", "G", 77, 5, 11)
drawstationuser(area8, "Żakowice", "ZP", 85, 17, 8)
drawstationuser(area8, "Południowe", "ZP", 84, 18, 10)
drawstationuser(area8, "Koluski", "KO", 126, 4, 7)
drawstationuser(area8, "Rogów", "Rg", 33, 27, 5)
drawstationuser(area8, "Skierniewice", "Sk", 102, 47, 12)
drawstationuser(area8, "Plyćwia", "Pl", 11, 40, 7)
drawstationuser(area8, "Radziwillów >>", "Zr", 9, 54, 14)
drawstationuser(area8, "Mazowiecki", "Zr", 9, 55, 10)
drawstationuser(area8, "<< Żyrardów", "Zr", 66, 48, 11)
drawstation2mots(area8, " Puszcza ", 151, 51, 9)
drawstation2mots(area8, "Mariańska", 151, 52, 9)
		if (settings.showHornZone != true) {
	drawstation2mots(area8, "│", 56, 9, 1)
	drawstation2mots(area8, "│", 56, 10, 1)
		} else {
	drawstation2mots(area8, "▲", 56, 9, 1)
	drawstation2mots(area8, "▲", 56, 10, 1)
		}

	if (isCurrentlyFlipped != true) {

		} else {
			
drawstation2mots(area1, "L001 : Zawiercie - Katowice", 1, 0, 27)
drawstation2mots(area1, "                           ", 132, 55, 27)
drawstation2mots(area1, " SERVER = ", 140, 0, 9)
drawstation2mots(area1, "                 ", 2, 56, 17) // ___ server
drawstationuser(area1, "Sosnowiec Główny", "SG", 93, 13, 16)
// drawstationuser(area1, "Dąbrowa Górnicza", "DG", 142, 11, 16)
drawstationuser(area1, "Dąbrowa Górnicza", "DG", 141, 17, 16)
drawstationuser(area1, "S.Południowy ", "Spł1", 95, 23, 14)
drawstation2mots(area1, "S.Dańdówka", 38, 38, 10)
drawstation2mots(area1, "                   ", 75, 3, 19)
drawstation2mots(area1, "<--- Góra Włodowska", 80, 1, 19)
drawstation2mots(area1, "Góra Włodowska", 85, 10, 14)
drawstationuser(area1, "   Łazy ŁC   ", "ŁC", 88, 38, 11)
drawstationuser(area1, "Łazy ", "LB", 104, 38, 5)
drawstationuser(area1, "  Łazy ŁA   ", "ŁA", 118, 53, 12)
drawstation2mots(area1, "           ", 49, 3, 11)
drawstation2mots(area1, "DTA R5", 51, 7, 6)
drawstation2mots(area1, "SG R52", 70, 37, 6)
drawstation2mots(area1, "Ko Tow.KTC", 147, 46, 10)
drawstation2mots(area1, "          ", 3, 10, 10)
// drawstation2mots(area1, "    120 ┌", 3, 10, 10)
// drawstation2mots(area1, "     118 ├ ", 3, 11, 11)
drawstation2mots(area1, "     │    ", 99, 18, 10)
drawstation2mots(area1, "          ", 112, 18, 10)
drawstation2mots(area1, "D.G. Tow", 56, 6, 8)
drawstation2mots(area1, "D.G. Tow", 63, 12, 8)
drawstation2mots(area1, "         ", 96, 50, 9)
drawstation2mots(area1, "       │ ", 89, 44, 9)

drawstation2mots(area2, "L004 : Grodzisk Mazowiecki - Zawiercie", 1, 0, 38)
drawstation2mots(area2, "                                      ", 121, 56, 38)
drawstation2mots(area2, " SERVER = ", 140, 0, 9)
drawstation2mots(area2, "               ", 4, 56, 15) // ___ server
drawstationuser(area2, "Biała Rawska >>", "St", 120, 45, 15)
drawstationuser(area2, "<< Strzałki", "St", 54, 38, 11)
drawstationuser(area2, "Olszamowice >>", "Ol", 89, 27, 14)
drawstationuser(area2, "<< Pilichowice", "Ol", 2, 34, 14)
drawstationuser(area2, "Opoczno Południe", "Op", 56, 36, 16)
drawstationuser(area2, "Włoszczowa Północ", "WP", 130, 17, 17)
drawstationuser(area2, "Starzyny >>", "Str", 38, 19, 11)
drawstationuser(area2, "<< Sprowa", "Str", 27, 19, 9)
drawstationuser(area2, "Góra Włodowska", "GW", 62, 8, 14)
drawstation2mots(area2, "<--- Grodzisk M.", 1, 3, 11)
drawstation2mots(area2, "-Markow-", 68, 0, 10)

drawstation2mots(area3, "L001 : Warszawa - Żyrardów-Korytów", 1, 0, 34)
drawstation2mots(area3, "3                                    ", 123, 56, 39)
drawstation2mots(area3, " SERVER = ", 140, 0, 9)
drawstation2mots(area3, "               ", 4, 56, 15) // ___ server
drawstation2mots(area3, "W.Targówek", 40, 24, 10)
drawstation2mots(area3, "Warszawa Praga", 27, 21, 14)
drawstation2mots(area3, "Warszawa Podskarbińska", 2, 17, 22)
drawstation2mots(area3, "Warszawa Podskarbińska", 6, 12, 22)
drawstation2mots(area3, "Warszawa Grochów", 5, 7, 16)
drawstation2mots(area3, "W.Olszynka", 5, 3, 10)
drawstation2mots(area3, "W.Grochów", 20, 1, 9)
drawstation2mots(area3, "W.Goląbki", 105, 29, 9)
drawstation2mots(area3, "          ", 110, 32, 10)
drawstation2mots(area3, "         ", 131, 55, 9)
drawstation2mots(area3, " ────── ──", 145, 53, 10)
drawstation2mots(area3, "         ", 46, 27, 9)
drawstation2mots(area3, "-Warszawa Wschodnia-", 58, 0, 20)
drawstation2mots(area3, "Warszawa Centralna", 121, 1, 18)
drawstation2mots(area3, "Warszawa Zachodnia", 9, 23, 18)
drawstationuser(area3, "Warszawa Włochy", "Wl", 79, 31, 15)
drawstation2mots(area3, "Warszawa Gł.Tow.", 75, 41, 16)
drawstation2mots(area3, "4    │            ", 69, 15, 16)
drawstation2mots(area3, "=== ┤            ", 70, 16, 16)
drawstationuser(area3, "<< Pruszków", "Pr", 21, 29, 11)
drawstationuser(area3, "Józefinów >>", "Pr", 50, 31, 12)
drawstationuser(area3, "Grodzisk Mazowiecki", "Gr", 86, 12, 19)
drawstation2mots(area3, "             ", 146, 50, 13)
drawstation2mots(area3, "Szeligi  --->", 146, 49, 13)
drawstationuser(area3, "- Korytów -", "Kr", 17, 6, 11)
drawstation2mots(area3, "           ", 125, 48, 11)
drawstation2mots(area3, "────┐     ", 103, 32, 10)
drawstation2mots(area3, "──── ┘   ", 125, 55, 9)
  
drawstation2mots(area4, "L131 - L171", 1, 0, 11)
drawstation2mots(area4, "           ", 148, 56, 11)
drawstation2mots(area4, " SERVER = ", 140, 0, 9)
drawstation2mots(area4, "               ", 4, 56, 15) // ___ server
drawstationuser(area4, "Sosnowiec Główny", "SG", 44, 10, 16)
drawstationuser(area4, "S.Południowy ", "Spł1", 43, 21, 14)
drawstationuser(area4, "S.Kazimierz ", "SKz", 72, 22, 13)
drawstation2mots(area4, "S.Dańdówka", 104, 17, 10)
drawstation2mots(area4, "  │      6", 46, 39, 10)
drawstation2mots(area4, "KWK Staszic", 129, 18, 11)
drawstation2mots(area4, "SG R52", 126, 39, 6)
drawstation2mots(area4, "DTA R5", 6, 32, 6)
drawstationuser(area4, "Będzin", "B", 76, 3, 6)
drawstationuser(area4, "Dąbrowa Górnicza", "DG", 109, 3, 16)
//drawstation2mots(area4, "-", 48, 53, 1)
//drawstation2mots(area4, " -", 82, 53, 2)
drawstationuser(area4, "K.Zawodzie", "KZ", 2, 3, 10)
//drawstation2mots(area4, "-  ", 155, 53, 3)
drawstation2mots(area4, "D.G. Tow", 9, 31, 8)
drawstation2mots(area4, "D.G. Tow", 18, 37, 8)
drawstation2mots(area4, "─── ┐     ", 132, 19, 11)
drawstation2mots(area4, "Staszic  ", 142, 25, 10)

drawstation2mots(area5, "L062 - L171 : Sedziszow - Zawodzie", 125, 56, 34)
drawstation2mots(area5, "<--- Psary  - Starzyny >> -         ", 0, 0, 36)
drawstation2mots(area5, " SERVER = ", 140, 0, 9)
drawstation2mots(area5, "              ", 4, 56, 15) // ___ server
drawstation2mots(area5, "SG R52", 126, 41, 6)
drawstation2mots(area5, "Jaroszowiec Olkuski", 66, 20, 19)
drawstationuser(area5, "<< Kozłów", "Kz", 62, 55, 9)
drawstation2mots(area5, "        │   ", 67, 7, 12)
drawstationuser(area5, "Klimontów >>", "Kz", 82, 44, 12)
drawstation2mots(area5, "  ", 65, 7, 2)
drawstationuser(area5, "Starzyny >>", "Str", 136, 56, 11)
drawstationuser(area5, "<< Sprowa", "Str", 127, 54, 9)
drawstation2mots(area5, "  D.G.Poludniowa    ", 12, 31, 20)
drawstationuser(area5, "D.G.Wschodnia", "DW", 140, 1, 14)
drawstationuser(area5, "S.Kazimierz", "SKz", 94, 1, 12)
drawstation2mots(area5, "S.Dańdówka", 78, 29, 10)
drawstation2mots(area5, "KWK Staszic", 139, 35, 11)

drawstation2mots(area6, "L062 : Sędziszów-Psary-Koniecpol - S.Południowy (adapted from Besentv)       ", 1, 0, 76)
drawstation2mots(area6, "                                                                                 ", 89, 56, 80)
drawstation2mots(area6, " SERVER = ", 140, 0, 9)
drawstation2mots(area6, "                    ", 1, 56, 18) // ___ server
drawstation2mots(area6, "Jaroszowiec Olkuski", 89, 28, 19)
drawstationuser(area6, "<< Kozłów", "Kz", 82, 55, 9)
drawstationuser(area6, "Klimontów >>", "Kz", 98, 49, 12)
drawstationuser(area6, "Starzyny >>", "Str", 107, 37, 11)
drawstationuser(area6, "<< Sprowa", "Str", 103, 33, 9)
drawstationuser(area6, "Julius", "Ju", 50, 13, 6)
drawstationuser(area6, "S.Południowy ", "Spł1", 10, 11, 14)
drawstationuser(area6, "S.Kazimierz ", "SKz", 63, 2, 13)
drawstationuser(area6, "D.G.Wschodnia ", "DW", 106, 2, 15)
drawstation2mots(area6, "S.Główny", 147, 54, 8)
drawstation2mots(area6, "        ", 5, 2, 8)
drawstation2mots(area6, "SG R52", 149, 49, 6)
drawstation2mots(area6, "        ", 5, 5, 6)
drawstation2mots(area6, "S.Dańdówka", 116, 52, 10)
drawstation2mots(area6, "S.Porąbka ", 101, 51, 10)
drawstation2mots(area6, "KWK Staszic", 132, 43, 11)
drawstation2mots(area6, "        ", 102, 11, 8)
drawstation2mots(area6, "Dorota->", 50, 45, 8)
drawstation2mots(area6, "D.G.Strzemieszyce", 58, 43, 18)
drawstation2mots(area5, " ────── ┘  ", 72, 27, 10)
drawstation2mots(area5, "==─ ─ ┴ ─====─", 131, 25, 14)

drawstation2mots(area6, "                 ", 84, 13, 17)
drawstation2mots(area6, "─┼ ─====─ ", 34, 4, 10)
drawstation2mots(area6, "         ", 49, 5, 9)

drawstation2mots(area7, "L008 : Kozłów - Kraków", 137, 56, 22)
drawstation2mots(area7, "                 - Kozłów -", 1, 0, 27)
drawstation2mots(area7, " SERVER = ", 140, 0, 9)
drawstation2mots(area7, "               ", 4, 56, 15) // ___ server
drawstationuser(area7, "   Kraków   ", "KPm", 58, 26, 12)
drawstationuser(area7, "Przedmieście", "KPm", 58, 25, 12)
drawstation2mots(area7, "  Kraków  ", 118, 28, 10)
drawstation2mots(area7, "  Główny  ", 118, 29, 10)
drawstation2mots(area7, "          ", 118, 30, 10)
drawstation2mots(area7, "  Kraków  ", 106, 27, 10)
drawstation2mots(area7, "  Olsza   ", 106, 28, 10)
drawstation2mots(area7, "  Kraków  ", 148, 37, 10)
drawstation2mots(area7, " Zablocie ", 148, 38, 10)

drawstation2mots(area8, "L001 - L017 : Łódź - Żyrardów (adapted from Besentv)", 1, 0, 52)
    if (isCurrentlyFlipped == true) {
drawstation2mots(area8, "[4] L001_Zy_WSD   [5] L171_L131                        ", 105, 57, 55)
   } else {
drawstation2mots(area8, "   [4] L001_Zy_WSD   [5] L171_L131               ", 110, 57, 52)	   
   }	   
drawstation2mots(area8, " SERVER = ", 140, 0, 9)
drawstation2mots(area8, "Keyboard shortcuts: ", 0, 57, 20) // ___ server
drawstation2mots(area8, "<--- Grodzisk Mazowiecki", 13, 3, 24)
drawstation2mots(area8, "  1       4", 83, 7, 11)
drawstationuser(area8, "Żyrardów >>", "Zr", 66, 47, 11)
drawstation2mots(area8, "           ", 83, 8, 11)
drawstation2mots(area8, "          ", 141, 1, 10)
drawstation2mots(area8, "                        ", 133, 3, 24)
drawstationuser(area8, "  << Radziwillów  ", "Zr", 7, 54, 18)
drawstationuser(area8, "Mazowiecki", "Zr", 10, 53, 10)
drawstation2mots(area8, "      ", 142, 9, 7)
drawstationuser(area8, "Plyćwia", "Pl", 12, 46, 7)
drawstation2mots(area8, "  3    ", 142, 16, 7)  // Plyćwia
drawstation2mots(area8, "       ", 142, 17, 7)  // Plyćwia
drawstation2mots(area8, "              ", 38, 25, 14)
drawstationuser(area8, "Skierniewice", "Sk", 104, 47, 12)
drawstation2mots(area8, "            ", 44, 10, 12)
//drawstationuser(area8, "\u25a3 ", "Sk", 99, 46, 2)
drawstation2mots(area8, " Puszcza ", 0, 5, 9)
drawstation2mots(area8, "Mariańska", 0, 6, 9)
drawstation2mots(area8, "         ", 151, 51, 9)
drawstation2mots(area8, "         ", 151, 52, 9)
drawstation2mots(area8, " ┬ ──────", 151, 39, 9)
drawstation2mots(area8, " │       ", 151, 40, 9)
drawstation2mots(area8, " Mikolajow ", 0, 25, 11)
drawstation2mots(area8, "    Mk     ", 0, 26, 11)
drawstation2mots(area8, "     ", 122 , 30, 6)
drawstationuser(area8, "  Rogów  ", "Rg", 31, 27, 9)
drawstation2mots(area8, "            ", 60, 34, 12)
drawstation2mots(area8, "          ", 64 , 34, 10)
drawstation2mots(area8, "          ", 64, 35, 10)
drawstationuser(area8, " Żakowice ", "ZP", 85, 17, 10)
drawstationuser(area8, "Południowe", "ZP", 85, 16, 10)
drawstation2mots(area8, " ", 75 , 39, 1)  // Żakowice
drawstation2mots(area8, "            ", 64 , 38, 12)  // Żakowice
drawstation2mots(area8, "Łódź Olechów", 103, 33, 12)
drawstation2mots(area8, "           ", 134, 35, 11)
drawstationuser(area8, "  Łódź Widzew  ", "LW", 13, 20, 15)
////drawstation2mots(area8, "            ", 71, 51, 12)
drawstationuser(area8, "<< Łódź", "G", 42, 8, 7)
drawstation2mots(area8, "  124    ", 110, 46, 9)
drawstationuser(area8, "Andrzejów", "G", 41, 7, 9)
drawstation2mots(area8, "         ", 110, 47, 9)
drawstationuser(area8, "Galkówek >>", "G", 77, 5, 11)
drawstation2mots(area8, "           ", 72, 52, 11)  // Galkówek
drawstationuser(area8, "Koluski", "KO", 126, 3, 7)
drawstation2mots(area8, "       ", 27, 52, 7)
	drawstation2mots(area8, "     ", 56, 8, 5)
	drawstation2mots(area8, "     ", 56, 9, 5)
	drawstation2mots(area8, "     ", 56, 10, 5)
	drawstation2mots(area8, "──", 56, 11, 2)
drawstationuser(area8, "\u25a3 ", "Sk", 100, 46, 2) // Skierniewice
drawstationuser(area8, "\u25a3 ", "Pl", 17, 47, 2) // Plyćwia
	drawstation2mots(area8, " \u25bc", 141, 9, 2)
	drawstationuser(area8, "\u25a3 ", "G", 88, 6, 2) // Galkówek
		if (settings.showHornZone != true) {
	drawstation2mots(area8, "│", 103, 47, 1)
	drawstation2mots(area8, "│", 103, 48, 1)
		} else {
	drawstation2mots(area8, "▲", 103, 47, 1)
	drawstation2mots(area8, "▲", 103, 48, 1)
		}

		}

	if (isCurrentlyFlipped != true) {
				
drawstation2mots(area1, " <D ", 75, 29, 4)  // OK
drawstation2mots(area1, "<D ", 79, 39, 3)	// OK	
drawstation2mots(area1, " E> ", 75, 35, 4)  // OK
drawstation2mots(area1, "E> ", 79, 43, 3)   // OK

drawstation2mots(area6, "<A   ", 5, 24, 5)
drawstation2mots(area6, " A>  ", 150, 5, 5)   
drawstation2mots(area6, "<B  ", 1, 41, 4)
drawstation2mots(area6, "   B>", 93, 24, 5)

		} else {
			
drawstation2mots(area1, "D>", 82, 27, 2)
drawstation2mots(area1, "D>", 79, 17, 2)		
drawstation2mots(area1, "<E", 82, 21, 2)
drawstation2mots(area1, "<E", 79, 13, 2)

drawstation2mots(area6, "<A   ", 7, 51, 5)
drawstation2mots(area6, "  A>", 151, 32, 4)   
drawstation2mots(area6, "<B  ", 62, 32, 4)
drawstation2mots(area6, " B>", 156, 15, 3)			
					
	}

		}

   }

function drawstation2mots(areax, namestation, x, y, maxLength) {
	globalThis.userstation = "neant";
	userstation2 = "rien";	
			if (areax != globalThis_area0) {
	} else {
			n = namestation;

    ctx.fillStyle = coloursPalette[settings.colour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = coloursPalette[settings.colour][1];
			
	// Set the text right aligned

    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

    //Draw number
    for (let i = 0; i < n.length; i++) {

    ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);

        }
	
 }
 }

function drawstationuser(areax, namestation, nameprefix, x, y, maxLength) {
	globalThis.userstation = "neant";
	userstation2 = "rien";	
			if (areax != globalThis_area0) {
	} else {
	if (globalThis.station1 != nameprefix) {
//				globalThis.userstation = globalThis.station0;
//				userstation2 = "rien";	
		} else {
		// On a trouve la station equivalent à ses initiales
				if (globalThis.station2 != "") {
					userstation2 = "*User*";					
					globalThis.userstation = globalThis.station2;					
				} else {
					userstation2 = "neant";
					globalThis.userstation = globalThis.station0;
		        }

			
				if (userstation2 != "*User*") {
////////// NO User .... 	

			n = namestation;

	if (isCurrentlyFlipped != true) {
		} else {
			x = (160 - x) - maxLength;
			y = 56 - y;
		}		
		
			ctx.fillStyle = "#000000";
///    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
	ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
			
	// Set the text right aligned

    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

    //Draw number
    for (let i = 0; i < n.length; i++) {

					ctx.fillStyle = "#88f8f8";
///    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
    ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);

        }

	} else {
////////// = User .... 		

			n = namestation;

	if (isCurrentlyFlipped != true) {
		} else {
			x = (160 - x) - maxLength;
			y = 56 - y;
		}		

//    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
	ctx.fillStyle = "#80dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
//    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			
	// Set the text right aligned

    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

    //Draw number
    for (let i = 0; i < n.length; i++) {

		ctx.fillStyle = "#000000";
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
    }
        }	
 }
 }

function createSpeedBoxFromTrain(train, isSpeedBox = false, train3) {
    let speedBox = train;
    let x = train[1];
    let x2 = train[1];
    let y = train[2];
	globalThis.train4 = train[4];
//	globalThis.user = train[0];
			globalThis.user = train6[train3];
//			globalThis.user = train3;

	let box = 0;
    speedBox[1] = (train[4] === 1 ? (speedBox[1] = x + 2) : (x - 1));
    speedBox2 = (train[4] === 1 ? (speedBox[1] = x2 + 2) : (x2 - 1));
    speedBox[2] = y - 1;


	if (globalThis.train4 === 1) {
//	if (speedBox2 == x2 + 2) {
	globalThis.senstrain = -1;
	}
	if (globalThis.train4 === 0) {
//	if (speedBox2 == x2 - 1) {
	globalThis.senstrain = 1;
	}
//	if (isSpeedBox) {
//	if (train[4] == 1) {
//		box == -1;
//	} else {
//		box == 1;
//	}	
//	}

    return speedBox;
}

function drawNumberBox(number = null, x, y, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 6) {

////    if ((trainBackgroundColour === null) || ((settings.showTrainSpeed) && (isSpeedBox === false)))
    if ((trainBackgroundColour === null))
    trainBackgroundColour = settings.colour;

    if (isSpeedBox)
        number = speed.toFixed(0);

    let n = number + "";
	if (number != "xxxxxx") {
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    } else {
	ctx.fillStyle = "#999999";
    }
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];

    //Set the text right aligned
    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}

function drawNumberBox4(number = null, x, y, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 6) {

	Humain = 0;

   if ((trainBackgroundColour === null) || ((settings.showTrainSpeed) && (isSpeedBox === false)))

    trainBackgroundColour = settings.colour;

    if (isSpeedBox)
        number = speed.toFixed(0);


	if ((globalThis.train4 == 1)) {	
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect((x - 1) * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
		    } else {
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
	}				
	if ((globalThis.train4 == 1)) {
//	  n = number + "" + ">";
	x = x - 1;
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "" + number + "" + ">";
	humain = false;
		    } else {
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "*" + number + "" + "*>";
	humain = true;
	
		}
		
    } else {	
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<" + number + "";
	humain = false;
		    } else {
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<*" + number + "*";
	humain = true;		
		}	
		
    }

// ****************** Train à l'arret *****************
	if ((number < 1)) {
			if ((globalThis.train4 == 1)) {
				x = x - 3;
			} else {
				x = x - 1;
			}
	maxLength = 10;
			if (humain) {
	ctx.fillStyle = "#80dfff";
			} else {
	ctx.fillStyle = "#afdf44";				
			}
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];

			if (globalThis.train4 != 1) {
			if (humain) {
	n = "<*Stopped*";
			} else {
	n = "< Stopped";	
			}
			} else {
			if (humain) {
	n = "*Stopped*>";
			} else {
	n = " Stopped >";
			}
			}
    }
// ****************** Train à l'arret *****************
	


    //Set the text right aligned
	if (globalThis.train4 == 1) {
    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

		    } else {

    }

    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}


function createSpeedBoxFromTrain5(train, isSpeedBox = false, train3) {
    let speedBox = train;
    let x = train[1];
    let x2 = train[1];
    let y = train[2];
	globalThis.train4 = train[4];
//	globalThis.user = train[0];
			globalThis.user = train6[train3];
//			globalThis.user = train3;

	let box = 0;
    speedBox[1] = (train[4] === 1 ? (speedBox[1] = x + 2) : (x - 1));
    speedBox2 = (train[4] === 1 ? (speedBox[1] = x2 + 2) : (x2 - 1));
    speedBox[2] = y - 1;


	if (globalThis.train4 === 1) {
//	if (speedBox2 == x2 + 2) {
	globalThis.senstrain = -1;
	}
	if (globalThis.train4 === 0) {
//	if (speedBox2 == x2 - 1) {
	globalThis.senstrain = 1;
	}
//	if (isSpeedBox) {
//	if (train[4] == 1) {
//		box == -1;
//	} else {
//		box == 1;
//	}	
//	}

    return speedBox;
}

function createSpeedBoxFromTrain6(train, isSpeedBox = false, train3) {
    let speedBox = train;
    let x = train[1];
    let x2 = train[1];
    let y = train[2];
	globalThis.train4 = train[4];
//	globalThis.user = train[0];
			globalThis.user = train6[train3];
//			globalThis.user = train3;

	let box = 0;
    speedBox[1] = (train[4] === 1 ? (speedBox[1] = x + 2) : (x - 1));
    speedBox2 = (train[4] === 1 ? (speedBox[1] = x2 + 2) : (x2 - 1));
    speedBox[2] = y - 1;


	if (globalThis.train4 === 1) {
//	if (speedBox2 == x2 + 2) {
	globalThis.senstrain = -1;
	}
	if (globalThis.train4 === 0) {
//	if (speedBox2 == x2 - 1) {
	globalThis.senstrain = 1;
	}
//	if (isSpeedBox) {
//	if (train[4] == 1) {
//		box == -1;
//	} else {
//		box == 1;
//	}	
//	}

    return speedBox;
}

function createSpeedBoxFromTrain7(train, isSpeedBox = false, train3) {
    let speedBox = train;
    let x = train[1];
    let x2 = train[1];
    let y = train[2];
	globalThis.train4 = train[4];
//	globalThis.user = train[0];
			globalThis.user = train6[train3];
//			globalThis.user = train3;

	let box = 0;
    speedBox[1] = (train[4] === 1 ? (speedBox[1] = x + 2) : (x - 1));
    speedBox2 = (train[4] === 1 ? (speedBox[1] = x2 + 2) : (x2 - 1));
    speedBox[2] = y - 1;


	if (globalThis.train4 === 1) {
//	if (speedBox2 == x2 + 2) {
	globalThis.senstrain = -1;
	}
	if (globalThis.train4 === 0) {
//	if (speedBox2 == x2 - 1) {
	globalThis.senstrain = 1;
	}
//	if (isSpeedBox) {
//	if (train[4] == 1) {
//		box == -1;
//	} else {
//		box == 1;
//	}	
//	}

    return speedBox;
}

function createSpeedBoxFromTrain8(train, isSpeedBox = false, train3) {
    let speedBox = train;
    let x = train[1];
    let x2 = train[1];
    let y = train[2];
	globalThis.train4 = train[4];
//	globalThis.user = train[0];
			globalThis.user = train6[train3];
//			globalThis.user = train3;

	let box = 0;
    speedBox[1] = (train[4] === 1 ? (speedBox[1] = x + 2) : (x - 1));
    speedBox2 = (train[4] === 1 ? (speedBox[1] = x2 + 2) : (x2 - 1));
    speedBox[2] = y - 1;


	if (globalThis.train4 === 1) {
//	if (speedBox2 == x2 + 2) {
	globalThis.senstrain = -1;
	}
	if (globalThis.train4 === 0) {
//	if (speedBox2 == x2 - 1) {
	globalThis.senstrain = 1;
	}
//	if (isSpeedBox) {
//	if (train[4] == 1) {
//		box == -1;
//	} else {
//		box == 1;
//	}	
//	}

    return speedBox;
}

function drawNumberBox5(number = null, x, y, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 8) {
// pour afficher le type de loco
	Humain = 0;

   if ((trainBackgroundColour === null) || ((settings.showTrainSpeed) && (isSpeedBox === false)))

    trainBackgroundColour = settings.colour;

    if (isSpeedBox)
        numberspeed = speed.toFixed(0);

number = train8[train3];
        if (number.substring(0, 5) != "Light") {
maxLengthHLP = 0
	} else {
maxLengthHLP = 6		
	}
//	console.log("2515 - number : ", number, "train8[train3] : ", train8[train3], "HLP : ", number.substring(5,8));

//	if ((globalThis.train4 == 1)) {	
//    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
//    ctx.fillRect((x - 1) * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
//    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
//		    } else {
//    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
//    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
//    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
//	}				
	if ((globalThis.train4 == 1)) {
//	  n = number + "" + " >";
//	x = x - 1;
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = type de loco

	maxLength = maxLengthHLP + 7;
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = " " + number + " " + ">";

	humain = false;
		    } else {
	maxLength = maxLengthHLP + 9;
	ctx.fillStyle = "#48dfff";

    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = " *" + number + "" + "*>";

	humain = true;
//console.log("n train4 = 1 : ", n);
		}
		
    } else {	
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
	maxLength = maxLengthHLP + 7;
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "< " + number + "";

	humain = false;
		    } else {
	maxLength = maxLengthHLP + 9;
	ctx.fillStyle = "#48dfff";

    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<*" + number + "*";

	humain = true;		
		}	
//console.log("n train4 = -1 : ", n);		
    }

// ****************** Train à l'arret *****************
	if ((numberspeed < 1)) {
//			if ((globalThis.train4 == 1)) {
//				x = x - 1;
//			} else {
//				x = x - 2;
//			}
///	maxLength = 8;
        if (number.substring(0,5) != "Light") {
maxLengthHLP = 0
	} else {
maxLengthHLP = 6		
	}
			if (humain) {
	ctx.fillStyle = "#b8dfff";
			} else {
	ctx.fillStyle = "#afdfaa";	// afdfaa			
			}

    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];

			if (globalThis.train4 != 1) {
			if (humain) {
	maxLength = maxLengthHLP + 9;
	n = "<*" + number + "*";
			} else {
	maxLength = maxLengthHLP + 6;
	n = "< " + number + "";				
			}
			} else {
			if (humain) {
	maxLength = maxLengthHLP + 9;
	n = "*" + number + "*>";
			} else {
	maxLength = maxLengthHLP + 6;
	n = " " + number + " >";				
			}
			}
    }

// ****************** Train à l'arret *****************

	n = n.trimRight();
maxLength = n.length
	
    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}

function drawNumberBox6(number = null, x, y, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 6) {
// pour afficher la vitesse max
	Humain = 0;

   if ((trainBackgroundColour === null) || ((settings.showTrainSpeed) && (isSpeedBox === false)))

    trainBackgroundColour = settings.colour;

    if (isSpeedBox)
        numberspeed = speed.toFixed(0);

number = "v " + train9[train3] + "";
        if (number.substring(0,5) != "Light") {
maxLengthHLP = 0
	} else {
maxLengthHLP = 5		
	}
	if ((globalThis.train4 == 1)) {	
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect((x - 1) * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
		    } else {
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
	}				
	if ((globalThis.train4 == 1)) {
//	  n = number + "" + ">";
	x = x - 1;
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
	maxLength = maxLengthHLP + 6;
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "" + number + "" + ">";
	humain = false;
		    } else {
	maxLength = maxLengthHLP + 8;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "*" + number + "" + "*>";
	humain = true;

		}
		
    } else {	
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
	maxLength = maxLengthHLP + 6;
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<" + number + "";
	humain = false;
		    } else {
	maxLength = maxLengthHLP + 8;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<*" + number + "*";
	humain = true;		
		}	
		
    }

// ****************** Train à l'arret *****************
	if ((numberspeed < 1)) {
        if (number.substring(0,5) != "Light") {
maxLengthHLP = 0
	} else {
maxLengthHLP = 5		
	}
			if (humain) {

	ctx.fillStyle = "#80dfff";
			} else {
	ctx.fillStyle = "#ff007f";				
			}
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];

			if (globalThis.train4 != 1) {
			if (humain) {
	maxLength = maxLengthHLP + 8;
			n = "<*" + number + "*";
			} else {
	maxLength = maxLengthHLP + 6;
			n = "<" + number + "";			
			}
			} else {
			if (humain) {
	maxLength = maxLengthHLP + 8;
			n = "*" + number + "" + "*>";
			} else {
	maxLength = maxLengthHLP + 6;
			n = "" + number + "" + ">";			
			}
			}
    }
// ****************** Train à l'arret *****************
	


    //Set the text right aligned
	if (globalThis.train4 == 1) {
    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

		    } else {

    }

    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}

function drawNumberBox7(number = null, x, y, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 6) {
// pour afficher le Type du Train (son code : exemple "EIP")
	Humain = 0;

   if ((trainBackgroundColour === null) || ((settings.showTrainSpeed) && (isSpeedBox === false)))

    trainBackgroundColour = settings.colour;

    if (isSpeedBox)
        numberspeed = speed.toFixed(0);

number = train10[train3];
        if (number.substring(0,5) != "Light") {
maxLengthHLP = 0
number = "" + number;
	} else {
maxLengthHLP = 2
	
	}
	if ((globalThis.train4 == 1)) {	
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect((x - 1) * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
		    } else {
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
	}				
	if ((globalThis.train4 == 1)) {
//	  n = number + "" + ">";
	x = x - 1;
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
	maxLength = maxLengthHLP + 6;
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "" + number + "" + ">";
	humain = false;
		    } else {
	maxLength = maxLengthHLP + 8;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "*" + number + "" + "*>";
	humain = true;

		}
		
    } else {	
		if (globalThis.user != "user") {
	//// * = User - not Bot
	//// number = vitesse
	maxLength = maxLengthHLP + 6;
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<" + number + "";
	humain = false;
		    } else {
	maxLength = maxLengthHLP + 8;
	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "<*" + number + "*";
	humain = true;		
		}	
		
    }

// ****************** Train à l'arret *****************
	if ((numberspeed < 1)) {
        if (number.substring(0,5) != "Light") {
maxLengthHLP = 0
	} else {
maxLengthHLP = 5		
	}
			if (humain) {

	ctx.fillStyle = "#80dfff";
			} else {
	ctx.fillStyle = "#ff007f";				
			}
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];

			if (globalThis.train4 != 1) {
			if (humain) {
	maxLength = maxLengthHLP + 9;
			n = "<*" + number + "*";
			} else {
	maxLength = maxLengthHLP + 6;
			n = "<" + number + "";			
			}
			} else {
			if (humain) {
	maxLength = maxLengthHLP + 9;
			n = "*" + number + "" + "*>";
			} else {
	maxLength = maxLengthHLP + 6;
			n = "" + number + "" + ">";			
			}
			}
    }
// ****************** Train à l'arret *****************
	


    //Set the text right aligned
	if (globalThis.train4 == 1) {
    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

		    } else {

    }

    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}

function drawNumberBox8(number = null, x, y, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 8) {
// pour afficher Origine, Destination, Entry, Exit du Train
	Humain = 0;

   if ((trainBackgroundColour === null) || ((settings.showTrainSpeed) && (isSpeedBox === false)))

    trainBackgroundColour = settings.colour;

    if (isSpeedBox)
        numberspeed = speed.toFixed(0);

switch (globalThis.Key) {
	case "o":
	number = train11[train3];
	break;
	case "d":
	number = train12[train3];
	break;
	case "i":
	number = train13[train3];
	break;
	case "x":
	number = train14[train3];
	break;
	}

	if (number.length >= 8) {
		maxLength = (number.length) + 2;
	}
	
	if ((globalThis.train4 == 1)) {	
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect((x - 1) * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
		    } else {
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
	}				
	if ((globalThis.train4 == 1)) {
//	  n = number + "" + ">";
	x = x - 1;
		if (globalThis.user != "user") {
	//// * = User - not Bot

    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "" + number + "" + " >";
	humain = false;
		    } else {

	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "*" + number + "" + "* >";
	humain = true;

		}
		
    } else {	
		if (globalThis.user != "user") {
	//// * = User - not Bot

    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][1] : coloursPalette[trainBackgroundColour][0];
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "< " + number + "";
	humain = false;
		    } else {

	ctx.fillStyle = "#48dfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];
			n = "< *" + number + "*";
	humain = true;		
		}	
		
    }

// ****************** Train à l'arret *****************
	if ((numberspeed < 1)) {

			if (humain) {

	ctx.fillStyle = "#80dfff";
			} else {
	ctx.fillStyle = "#ff007f";				
			}
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = drawBoundingBox ? coloursPalette[trainBackgroundColour][0] : coloursPalette[trainBackgroundColour][1];

			if (globalThis.train4 != 1) {
			if (humain) {

			n = "< *" + number + "*";
			} else {

			n = "< " + number + "";			
			}
			} else {
			if (humain) {

			n = "*" + number + "" + "* >";
			} else {

			n = "" + number + "" + " >";			
			}
			}
    }
// ****************** Train à l'arret *****************
	


    //Set the text right aligned
	if (globalThis.train4 == 1) {
    for (let i = 1; i <= maxLength; i++) {
        if (n.length < i) {
            x++;
        }
    }

		    } else {

    }

    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}

function drawRadioBox(n = null, x, y, areax, couleur, speed = -1, signalDirection = 0, trainBackgroundColour = null, isSpeedBox = false, drawBoundingBox = true, maxLength = 6) {

///	if (([...n].length) > 6) {
	maxLength = n.length;
///	} else {
///		if (([...n].length) == 6) {
///			maxLength = 6;
///		} else {
///			maxLength = 4;
///		}
///    }
	
	if (globalThis_area0 != areax) {
	return;
    } else {
    }
	if ((maxLength == 1) || (maxLength == 2)) {
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
	return;
		    } else {
	if (couleur != 0) {
	ctx.fillStyle = "#888bbb";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = "#ffffff";
	    } else {
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * maxLength, textSize * textMargin);
    ctx.fillStyle = "#ffffff";

    }


    }

    //Draw number
    for (let i = 0; i < n.length; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
}




const vitalSymbols = ["/", "-", "\\", "|"];
var vitalSymbolId = 0;
function drawVitalSymbol(updateVitalSymbol) {
    drawNumberBox(vitalSymbols[vitalSymbolId % 4], 0, textLines - 2, null, 0, null, false, false, 1);
    if (updateVitalSymbol) {
        vitalSymbolId++;
    }
}

function drawScanLines() {
    const lineWidth = 2;
    ctx.strokeStyle = 'rgba(' + [0, 0, 0, 0.2] + ')';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let i = 0; i < screenHeight / lineWidth / 2; i++) {
        ctx.moveTo(0, i * lineWidth * 2);
        ctx.lineTo(screenWidth, i * lineWidth * 2);
    }
    ctx.stroke();
}

function resizeMonitor() {
    let cnv = document.getElementById("cnv");
    const clientScreenRatio = window.innerWidth / window.innerHeight;
    if (clientScreenRatio < screenRatio) { // Let's have black bars on top and bottom, for a cinematic look! ...on vertical screns, probably! Yaaaay!
        cnv.style.width = window.innerWidth + "px";
        cnv.style.height = window.innerWidth / screenRatio + "px";
    } else { // In this case, we'll have vertical black bars
        cnv.style.height = window.innerHeight + "px";
        cnv.style.width = window.innerHeight * screenRatio + "px";
    }
    cnv.style.left = (window.innerWidth - cnv.clientWidth) / 2 + "px"
}

function flipLayouts() {
    if (isCurrentlyFlipped == settings.flipped) {
        return;
    }
    isCurrentlyFlipped = settings.flipped;
    function replaceAt(text, index, replacement) {
        return text.substring(0, index) + replacement + text.substring(index + replacement.length);
    }
    for (let layoutId in layouts) {
        if (layoutId == "Settings") {
            continue;
        }
        if (layoutId == "Keys_Used") {
            continue;
        }
        layouts[layoutId] = layouts[layoutId].reverse();
        for (let i in layouts[layoutId]) {
            let signals = layouts[layoutId][i].split("'");
            let row = signals.shift();
            let flippedSignals = signals.reverse();
            let flippedRow = "";
            for (let i = row.length - 1; i >= 0; i--) {
                flippedRow += row[i];
            }
            flippedRow = flippedRow
                .replaceAll("{", "þ").replaceAll("}", "{").replaceAll("þ", "}")
                .replaceAll(">", "þ").replaceAll("<", ">").replaceAll("þ", "<")
                .replaceAll("├", "þ").replaceAll("┤", "├").replaceAll("þ", "┤")
                .replaceAll("┬", "þ").replaceAll("┴", "┬").replaceAll("þ", "┴")
                .replaceAll("┌", "þ").replaceAll("┘", "┌").replaceAll("þ", "┘")
                .replaceAll("└", "þ").replaceAll("┐", "└").replaceAll("þ", "┐")
                .replaceAll("▶", "þ").replaceAll(" ◀", "▶ ").replaceAll(" þ","◀ ");
////				let regex = /^([a-zA-Z0-9\Ł\ł\_ ąćęłńóśżźŁ]+)$/;
            let regex = /^([ąćęłńóśżźŁa-zA-Z0-9\Ł\ł\Ż\_]+)$/;
            let currentlyOnAStringThatNeedsToBeReverseFlipped = false;
            let stringsThatNeedsToBeReverseFlippedStartsAtId = 0;
            let stringToBeReverseFlipped = "";
            for (let charId in flippedRow) {
                if (regex.test(flippedRow[charId]) && charId < flippedRow.length - 1) {

//            if (charId != "_") {
//			} else {
//			charId = " ";	
//            }
                    if (!currentlyOnAStringThatNeedsToBeReverseFlipped) {
                        currentlyOnAStringThatNeedsToBeReverseFlipped = true;
                        stringsThatNeedsToBeReverseFlippedStartsAtId = charId * 1;
                    }
					
                    stringToBeReverseFlipped += flippedRow[charId];
                } else if (currentlyOnAStringThatNeedsToBeReverseFlipped) {
                    currentlyOnAStringThatNeedsToBeReverseFlipped = false;
                    let flippedString = "";
                    for (let i = stringToBeReverseFlipped.length - 1; i >= 0; i--) {
                        flippedString += stringToBeReverseFlipped[i];
                    }
                    flippedRow = replaceAt(flippedRow, stringsThatNeedsToBeReverseFlippedStartsAtId, flippedString);
                    stringToBeReverseFlipped = "";
                }
            }
            for (let signal of flippedSignals) {
                flippedRow += "'" + signal;
            }
            layouts[layoutId][i] = flippedRow;
        }
    }
    initCoords();
    updateTrainDescriber();
}

document.addEventListener("DOMContentLoaded", resizeMonitor);
window.onresize = resizeMonitor;

function changeSetting(x) {
   if (area != "Settings") {
        return;
    }
    let index = availableSettings[selectedSetting].indexOf(settings[selectedSetting]);
    index += x;
    if (index == availableSettings[selectedSetting].length) {
        index = 0;
    } else if (index < 0) {
        index = availableSettings[selectedSetting].length - 1;
    }
    settings[selectedSetting] = availableSettings[selectedSetting][index];
    let href = "";
    for (let id in availableSettings) {
        if (id == "server") {
            href += "_" + settings[id];

        } else {
            href += "_" + availableSettings[id].indexOf(settings[id]);
        }
    }
    window.location.href = "#" + href.slice(1);
    updateTrainDescriber();


}

function drawserver() {
	
    function writeCoolSettingName(settingName, isSelected) {
        if (settingName === true) {
            settingName = "YES   ";
        } else if (settingName === false) {
            settingName = "NO   ";
        }
        settingName = settingName.toUpperCase();
        settingName = settingName.substring(0, 6);
        for (let i = 6; i > settingName.length; i--) {
            settingName = settingName += " ";
        }
        settingName = (isSelected ? "◄ " : "  ") + settingName + (isSelected ? " ►" : "  ");
        return settingName;
    }
	
    for (let id of Object.keys(settings)) {

	if (settings[id] != "white ") {	
		
       if (coordinates.Settings[id] != undefined) {
           drawNumberBox(writeCoolSettingName(settings[id], id == selectedSetting), ...coordinates.Settings[id], 0, 0, null, false, id == selectedSetting, 8);
       }
   }
}
}


function changeSelectedSetting(x) {
/*    if (area != "Settings") {
        return;
    } */
    let index = Object.keys(availableSettings).indexOf(selectedSetting);
    index += x;
    if (index == Object.keys(availableSettings).length) {
        index = 0;
    } else if (index < 0) {
        index = Object.keys(availableSettings).length - 1;
    }
    selectedSetting = Object.keys(availableSettings)[index];
    updateTrainDescriber();
}

function keyboard(e) {
    //console.log("Key detected: " + e.key);
    let setAreaTo = area;
    switch (e.key.toLowerCase()) {
        case "1":
            setAreaTo = "L001_KO_Zw";
		globalThis.Key = "1";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "2":
            setAreaTo = "L004_Zw_Gr";
		globalThis.Key = "2";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "3":
			setAreaTo = "L001_L017_LW_Gr";
		globalThis.Key = "3";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "4":
            setAreaTo = "L001_Zy_WSD";
		globalThis.Key = "4";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "5":
            setAreaTo = "L171_L131";
		globalThis.Key = "5";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "6":
            setAreaTo = "L062_L171_SG_Tl";
		globalThis.Key = "6";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;   
		case "7":
            setAreaTo = "L062_SPł_Sd";
		globalThis.Key = "7";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "8":
            setAreaTo = "L008_KG_Kz";
		globalThis.Key = "8";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "e":
            setAreaTo = "Settings";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "k":
            setAreaTo = "Keys_Used";
		globalThis.showLoco = false;
		globalThis.showSpeed = false;
		globalThis.showTypeTrain = false;
		globalThis.showOrigine = false;
		globalThis.showDestination = false;
		globalThis.showEntry = false;
		globalThis.showExit = false;
            break;
        case "l":
	if (globalThis.showLoco != true) {
		globalThis.showLoco = true;
		globalThis.Key = "l";
    } else {
		globalThis.showLoco = false;
		globalThis.Key = "";
    }
            break;
        case "v":
	if (globalThis.showSpeed != true) {
		globalThis.showSpeed = true;
		globalThis.Key = "v";
    } else {
		globalThis.showSpeed = false;
		globalThis.Key = "";
    }
            break;
        case "t":
	if (globalThis.showTypeTrain != true) {
		globalThis.showTypeTrain = true;
		globalThis.Key = "t";
    } else {
		globalThis.showTypeTrain = false;
		globalThis.Key = "";
    }
            break;
	    case "o":
	if (globalThis.showOrigine != true) {
		globalThis.showOrigine = true;
		globalThis.Key = "o";
    } else {
		globalThis.showOrigine = false;
		globalThis.Key = "";
    }
            break;
	    case "d":
	if (globalThis.showDestination != true) {
		globalThis.showDestination = true;
		globalThis.Key = "d";
    } else {
		globalThis.showDestination = false;
		globalThis.Key = "";
    }
            break;
	    case "i":
	if (globalThis.showEntry != true) {
		globalThis.showEntry = true;
		globalThis.Key = "i";
    } else {
		globalThis.showEntry = false;
		globalThis.Key = "";
    }
            break;
	    case "x":
	if (globalThis.showExit != true) {
		globalThis.showExit = true;
		globalThis.Key = "x";
    } else {
		globalThis.showExit = false;
		globalThis.Key = "";
    }
            break;
        case "arrowleft":
//        case "a":
            changeSetting(-1);
            break;
        case "arrowright":
//        case "d":
            changeSetting(1);
            break;
        case "arrowup":
//        case "w":
            changeSelectedSetting(-1);
            break;
        case "arrowdown":
//        case "s":
            changeSelectedSetting(1);
            break;
    }
    if (area != setAreaTo) {
        updateTrainDescriber();
        updatestationDescriber();
        area = setAreaTo;
    }
			globalThis_area0 = setAreaTo;
}

document.addEventListener("keydown", keyboard);