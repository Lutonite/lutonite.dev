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
	showClosedTrack: false,
	showDottedLines: false,
	showHornZone: false,
	showRadioChannel: false,
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
	showClosedTrack: [true, false],
	showDottedLines: [true, false],
	showHornZone: [true, false],
	showRadioChannel: [true, false],
    drawScanLines: [true, false],
    flipped: [false, true],
    showTrainSpeed: [false, true],
	showNextSignalSpeed: [false, true],

};

const coloursPalette = {
    "green ": ["#000", "#0F0"],
    "white ": ["#000", "#ffffff"],
    "pink2 ": ["#000", "#eac8f0"],
    "orange": ["#000", "#E73"],
    "pink  ": ["#000", "#FBF"],
    "red   ": ["#000", "#F00"],
    "blue  ": ["#000", "#00F"],
    "yellow": ["#000", "#FF0"],
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
var	train1 = [];
var	train5 = [];
var	train6 = [];

var cnv, ctx, box, ni, x, x2, speedbox1, train2, train3;
globalThis.senstrain = -1;
globalThis.speedbox2 = 1;
// globalThis.train3 = 1;
globalThis.station0 = 1;
globalThis.station1 = 1;
globalThis.station2 = 1;
globalThis.station3 = 1;
globalThis.user = "NO ";
globalThis_area0 = "NO ";
globalThis_nbTrainUsers = 0;
globalThis_nbStationUsers = 0;
globalThis.userstation = "NO ";
globalThis.userstation2 = "NO ";
globalThis.couleurtrain = "green ";

        for (let i = 0; i < 1000; i++) {
			train1[i] = 0;
			train5[i] = 0;
			train6[i] = 0;			
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
        delete data.data[i].EndStation;
        delete data.data[i].ServerCode;
        delete data.data[i].StartStation;
        delete data.data[i].TrainName;
//        delete data.data[i].Type;
        delete data.data[i].Vehicles;
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
		    if (character == "△") {
				ctx.fillStyle = "#ffffff";
				text[row][char] = "△";
			}
		    if (character == "◯") {
				ctx.fillStyle = "#9f9f9f";
				text[row][char] = "◯";
			}
			}

			
//    }		

    if (settings.showDottedLines != false) {
		if (settings.showHornZone != false) {
			// True True
            ctx.fillText(text[row][char].replace("{", "─").replace("}", "─"), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
// ***
	if (text[row][char] != "‡" ) {
            ctx.fillText(text[row][char].replace("{", "─").replace("}", "─"), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
   } else {
// passages à niveau
	text[row][char] = "\u0058";
	n = "\u0058";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
	ctx.fillStyle = "#ffffff";
	text[row][char] = "\u01C0";
	n = "\u01C0";
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);		
	ctx.fillStyle = "#ffffff";			
        }
// ***
		} else {
			// True False
// ***
	if (text[row][char] != "‡" ) {
            ctx.fillText(text[row][char].replace("{", "─").replace("}", "─").replace("△", " "), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
   } else {
// passages à niveau
	text[row][char] = "\u0058";
	n = "\u0058";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
	ctx.fillStyle = "#ffffff";
	text[row][char] = "\u01C0";
	n = "\u01C0";
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);		
	ctx.fillStyle = "#ffffff";			
        }
// ***
		}		
    } else {
		if (settings.showHornZone != false) {
			//False True
// ***
	if (text[row][char] != "‡" ) {
            ctx.fillText(text[row][char].replace("{", "─").replace("}", "─").replace(".", " ").replace(":", " "), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
   } else {
// passages à niveau
	text[row][char] = "\u0058";
	n = "\u0058";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
	ctx.fillStyle = "#ffffff";
	text[row][char] = "\u01C0";
	n = "\u01C0";
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);		
	ctx.fillStyle = "#ffffff";			
        }
// ***
		} else {
			// False False
// ***
	if (text[row][char] != "‡" ) {
            ctx.fillText(text[row][char].replace("{", "─").replace("}", "─").replace(".", " ").replace(":", " ").replace("△", " "), textSize * char / textSizeRatio * textMargin, textSize * row * textMargin);
   } else {
// passages à niveau
	text[row][char] = "\u0058";
	n = "\u0058";
	ctx.fillStyle = "#000000";
    ctx.fillRect(char * textSize / textSizeRatio * textMargin, row * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);
	ctx.fillStyle = "#ffffff";
	text[row][char] = "\u01C0";
	n = "\u01C0";
	ctx.fillStyle = "#ff00ff";
            ctx.fillText(n, textSize * char / textSizeRatio * textMargin, textSize * row  * textMargin);		
	ctx.fillStyle = "#ffffff";		
        }
// ***
		}	
    }
		
        }
    }

    for (let row in menu) {
        for (let char in menu[row]) {
            ctx.fillText(menu[row][char], textSize * char / textSizeRatio * textMargin, textSize * (row * 1 + textLines - menu.length - 1) * textMargin);
        }
    }
	
    if (area == "Settings") {
        drawSettings();
n = "" + 40125 + "";

// green
x = 16;
y = 39;
	ctx.fillStyle = "#0F0";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// yellow
x = 16;
y = 38;
	ctx.fillStyle = "#FF0";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// orange
x = 16;
y = 37;
	ctx.fillStyle = "#E73";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// red
x = 16;
y = 36;
	ctx.fillStyle = "#F00";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 5; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// white - colour3
x = 16;
y = 40;
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
x = 84;
y = 14;
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
x = 84;
y = 16;
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
x = 84;
y = 18;
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
n = "GRAY";
x = 46;
y = 42;
	ctx.fillStyle = "#afdfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 4, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 4; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
n = "<*xxx*";
x = 62;
y = 42;
	ctx.fillStyle = "#afdfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
n = "*xxx*>";
x = 72;
y = 42;
	ctx.fillStyle = "#afdfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 6, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 6; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }	
// postes utilisables
n = "COLOURED";
x = 76;
y = 44;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 8, textSize * textMargin);
	ctx.fillStyle = "#88f8f8";
    //Draw number
    for (let i = 0; i < 8; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }		
// postes pris par users
n = "GRAY";
x = 93;
y = 44;
	ctx.fillStyle = "#afdfff";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 4, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 4; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }
// passages à niveau
///n = "X";
n = "\u0058";
x = 68;
y = 44;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
///n = "│";
n = "\u01C0";
x = 68;
y = 44;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ff00ff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);				
// zones de sifflet
n = "△";
x = 83;
y = 47;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ffffff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
n = "△";
x = 83;
y = 48;
	ctx.fillStyle = "#000000";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 1, textSize * textMargin);
	ctx.fillStyle = "#ffffff";
    //Draw number
        ctx.fillText(n, textSize * (x + 1) / textSizeRatio * textMargin, textSize * y * textMargin);
// Canaux Radio
n = " ◯";
x = 57;
y = 50;
	ctx.fillStyle = "#888bbb";
    ctx.fillRect(x * textSize / textSizeRatio * textMargin, y * textSize * textMargin, textSize / textSizeRatio * textMargin * 5, textSize * textMargin);
	ctx.fillStyle = "#000000";
    //Draw number
    for (let i = 0; i < 2; i++) {
        ctx.fillText(n[i], textSize * (x + 1 * i) / textSizeRatio * textMargin, textSize * y * textMargin);
    }

// nb Train Users
n = "" + globalThis_nbTrainUsers + "";
if (globalThis_nbTrainUsers <= 1)  {
n = n + " USER DRIVEN TRAIN";
    } else  {
n = n + " USERS DRIVEN TRAINS";
    }
///n = "123456";
x = 135;
y = 42;
	ctx.fillStyle = "#afdfff";
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
y = 44;
	ctx.fillStyle = "#afdfff";
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
        drawRadioBox("◯  5", 29, 14, area6, couleur);	// KWK Staszic		
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
		drawRadioBox("5 ◯  2", 62, 25, area3, couleur);	// Warszawa Wlochy
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
    switch  (settings.showNextSignalSpeed) {
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
///			train[6] = "YES";
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
        console.log("Some sections have more than one train on them: ", logSignalsWithMultipleTrains);
    }

    return trainsToDraw;
}

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
        for (let i = 0; i < 1000; i++) {
			if (train5[i] != train0[0]) {
		train3 = 1;
			} else {
		ii = i;
        }				
		}
				train3 = ii;

           if (train0[0] != "xxxxxx")  {
					drawNumberBox4(...createSpeedBoxFromTrain(train0, isSpeedBox = false, train3), true, true, 6);
			}	
			        } else {

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
drawstationuser(area1, "Katowice", "KO", 25, 21, 8)
drawstation2mots(area1, "Ko Tow.KTC", 3, 10, 10)
drawstationuser(area1, "K.Zawodzie", "KZ", 54, 13, 10)
drawstationuser(area1, "Sosnowiec Główny", "SG", 94, 13, 16)
drawstationuser(area1, "Będzin", "B", 124, 14, 6)
drawstationuser(area1, "Dąbrowa Górnicza", "DG", 142, 17, 16)
drawstationuser(area1, "S.Południowy", "Spł1", 96, 23, 13)
drawstationuser(area1, "DGHK", "DGHK", 16, 44, 4)
drawstationuser(area1, "Dąbrowa Górnicza Ząbkowice", "DZ", 30, 45, 26)
drawstationuser(area1, "Łazy ŁC", "ŁC", 90, 38, 6)
drawstationuser(area1, "Łazy", "LB", 105, 38, 4)
drawstationuser(area1, "Łazy ŁA", "ŁA", 121, 53, 6)
drawstationuser(area1, "Zawiercie", "Zw", 144, 45, 9)
drawstation2mots(area1, "S.Dańdówka", 112, 18, 10)
/////drawstation2mots(area1, "Góra Włodowska --->", 70, 2, 19)

drawstation2mots(area2, "L004 : Zawiercie - Grodzisk Mazowiecki", 1, 0, 38)
drawstationuser(area2, "Góra Włodowska", "GW", 62, 8, 14)
drawstationuser(area2, "Psary", "Ps", 67, 19, 5)
drawstationuser(area2, "<< Starzyny", "Str", 38, 19, 11)
drawstationuser(area2, "Sprowa >>", "Str", 27, 19, 9)
drawstationuser(area2, "Knapówka", "Kn", 99, 16, 8)
drawstationuser(area2, "Włoszczowa Północ", "WP", 130, 17, 17)
drawstationuser(area2, "Opoczno Południe", "Op", 56, 36, 16)
drawstationuser(area2, "<< Olszamowice", "Ol", 89, 27, 14)
drawstationuser(area2, "Pilichowice >>", "Ol", 2, 34, 14)
drawstationuser(area2, "- Idzikowice -", "Id", 110, 25, 14)
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
drawstation2mots(area3, "Warszawa Gł.Tow.", 70, 16, 16)
drawstationuser(area3, "Korytów", "Kr", 27, 8, 7)
drawstation2mots(area3, "W.Targówek", 110, 32, 10)
drawstation2mots(area3, "W.Grochów", 131, 55, 9)
drawstation2mots(area3, "W.Olszynka", 145, 53, 10)

drawstation2mots(area4, "L171 - L131", 1, 0, 11)
drawstationuser(area4, "K.Zawodzie", "KZ", 2, 3, 10)
drawstationuser(area4, "Sosnowiec Główny", "SG", 44, 10, 16)
drawstationuser(area4, "Będzin", "B", 76, 3, 6)
drawstationuser(area4, "Dąbrowa Górnicza", "DG", 111, 3, 16)
drawstationuser(area4, "S.Południowy", "Spł1", 43, 21, 13)
drawstationuser(area4, "Juliusz", "Ju", 62, 33, 7)
drawstationuser(area4, "Dorota", "Dra", 71, 53, 6)
drawstationuser(area4, "DGHK", "DGHK", 100, 51, 4)
drawstationuser(area4, "Dąbrowa Górnicza Ząbkowice", "DZ", 111, 53, 26)
drawstationuser(area4, "S.Kazimierz", "SKz", 72, 22, 12)
drawstationuser(area4, "Sławków", "Sl", 130, 8, 7)
drawstationuser(area4, "Dąbrowa Górnicza Wschodnia", "DW", 103, 30, 26)

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

///drawstation2mots(area5, "2 ◯  5", 63, 12, 6)
//        drawRadioBox("2 ◯  5", 63, 12, area5);	// S. Poludniowy - Dandowka

drawstation2mots(area6, "L062 : S.Południowy - Sędziszów-Psary-Koniecpol (adapted from Besentv)", 1, 0, 74)
drawstationuser(area6, "S.Południowy", "Spł1", 10, 11, 13)
drawstationuser(area6, "Julius", "Ju", 50, 13, 6)
drawstationuser(area6, "S.Kazimierz", "SKz", 64, 2, 12)
drawstationuser(area6, "D.G.Wschodnia", "DW", 106, 2, 14)
drawstationuser(area6, "Sławków", "Sl", 134, 11, 7)
drawstationuser(area6, "Bukowno", "Bo", 17, 32, 7)
drawstationuser(area6, "Tunel", "Tl", 45, 53, 5)
drawstationuser(area6, "Kozłów >>", "Kz", 82, 55, 9)
drawstationuser(area6, "<< Klimontów", "Kz", 98, 49, 12)
drawstationuser(area6, "<< Starzyny", "Str", 111, 37, 11)
drawstationuser(area6, "Sprowa >>", "Str", 103, 33, 9)
drawstationuser(area6, "Psary", "Ps", 137, 28, 5)
drawstation2mots(area6, "S.Główny", 5, 2, 8)
drawstation2mots(area6, "<-Dorota", 102, 11, 8)

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

// N'existe pas comme Dispatching ... drawstationuser(area3, "Warszawa Zachodnia", "WZD", 130, 28, 17)

	if (isCurrentlyFlipped != true) {

		} else {
			
drawstation2mots(area1, "L001 : Zawiercie - Katowice", 1, 0, 27)
drawstation2mots(area1, "                           ", 132, 55, 27)
drawstation2mots(area1, " SERVER = ", 140, 0, 9)
drawstation2mots(area1, "                 ", 2, 56, 17) // ___ server
drawstationuser(area1, "Sosnowiec Główny", "SG", 94, 13, 16)
// drawstationuser(area1, "Dąbrowa Górnicza", "DG", 142, 11, 16)
drawstationuser(area1, "Dąbrowa Górnicza", "DG", 142, 17, 16)
drawstationuser(area1, "S.Południowy ", "Spł1", 96, 23, 14)
drawstation2mots(area1, "S.Dańdówka", 38, 38, 10)
drawstation2mots(area1, "                   ", 75, 3, 19)
drawstation2mots(area1, "<--- Góra Włodowska", 80, 1, 19)
drawstation2mots(area1, "Góra Włodowska", 85, 10, 14)
drawstationuser(area1, " - Łazy ŁC - ", "ŁC", 89, 38, 11)
drawstationuser(area1, "Łazy ", "LB", 104, 38, 5)
drawstationuser(area1, "- Łazy ŁA - ", "ŁA", 119, 53, 12)
drawstation2mots(area1, "           ", 49, 3, 11)
drawstation2mots(area1, "DTA R5", 51, 7, 6)
drawstation2mots(area1, "SG R52", 70, 37, 6)
drawstation2mots(area1, "Ko Tow.KTC", 147, 46, 10)
drawstation2mots(area1, "          ", 3, 10, 10)
// drawstation2mots(area1, "    120 ┌", 3, 10, 10)
// drawstation2mots(area1, "     118 ├ ", 3, 11, 11)
drawstation2mots(area1, "     │    ", 99, 18, 10)
drawstation2mots(area1, "          ", 112, 18, 10)

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

drawstation2mots(area3, "L001 : Warszawa - Zyrardów-Korytów", 1, 0, 34)
drawstation2mots(area3, "                                   ", 127, 56, 35)
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
drawstation2mots(area3, "  -Warszawa Włochy-", 66, 25, 19)
drawstation2mots(area3, "Warszawa Gł.Tow.", 74, 40, 16)
drawstation2mots(area3, "=== ┤            ", 70, 16, 16)
drawstationuser(area3, "<< Pruszków", "Pr", 21, 29, 11)
drawstationuser(area3, "Józefinów >>", "Pr", 50, 31, 12)
drawstationuser(area3, "Grodzisk Mazowiecki", "Gr", 86, 12, 19)
drawstation2mots(area3, "             ", 146, 50, 13)
drawstation2mots(area3, "Szeligi  --->", 146, 49, 13)
drawstationuser(area3, "- Korytów -", "Kr", 29, -1, 11)
drawstation2mots(area3, "           ", 125, 48, 11)
 //  drawstationuser(area3, "Korytów", "Kr", 27, 8, 7)
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
drawstation2mots(area4, "KWK Staszic", 129, 18, 11)
drawstation2mots(area4, "SG R52", 126, 39, 6)
drawstation2mots(area4, "DTA R5", 6, 32, 6)

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
drawstation2mots(area5, "- D.G.Poludniowa -  ", 12, 31, 20)
drawstationuser(area5, "D.G.Wschodnia", "DW", 140, 1, 14)
drawstationuser(area5, "S.Kazimierz", "SKz", 94, 1, 12)
drawstation2mots(area5, "S.Dańdówka", 78, 29, 10)
drawstation2mots(area5, "KWK Staszic", 139, 35, 11)

drawstation2mots(area6, "L062 : Sędziszów-Psary-Koniecpol - S.Południowy (adapted from Besentv)       ", 1, 0, 76)
drawstation2mots(area6, "                                                                                 ", 91, 55, 79)
drawstation2mots(area6, " SERVER = ", 140, 0, 9)
drawstation2mots(area6, "                    ", 1, 56, 18) // ___ server
drawstation2mots(area6, "Jaroszowiec Olkuski", 89, 28, 19)
drawstationuser(area6, "<< Kozłów", "Kz", 82, 55, 9)
drawstationuser(area6, "Klimontów >>", "Kz", 98, 49, 12)
drawstationuser(area6, "Starzyny >>", "Str", 111, 37, 11)
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
drawstation2mots(area6, "KWK Staszic", 126, 43, 11)
drawstation2mots(area6, "        ", 102, 11, 8)
drawstation2mots(area6, "Dorota->", 50, 45, 8)
drawstation2mots(area6, "D.G.Strzemieszyce", 58, 43, 18)

drawstation2mots(area7, "L008 : Kozłów - Kraków", 137, 56, 22)
drawstation2mots(area7, "                 - Kozłów -", 1, 0, 27)
drawstation2mots(area7, " SERVER = ", 140, 0, 9)
drawstation2mots(area7, "               ", 4, 56, 15) // ___ server
drawstationuser(area7, " - Kraków - ", "KPm", 58, 26, 12)
drawstationuser(area7, "Przedmieście", "KPm", 58, 25, 12)
drawstation2mots(area7, "- Kraków -", 118, 28, 10)
drawstation2mots(area7, "  Główny  ", 118, 29, 10)
drawstation2mots(area7, "          ", 118, 30, 10)
drawstation2mots(area7, "- Kraków -", 106, 27, 10)
drawstation2mots(area7, "  Olsza   ", 106, 28, 10)
drawstation2mots(area7, "- Kraków -", 148, 37, 10)
drawstation2mots(area7, " Zablocie ", 148, 38, 10)

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
	ctx.fillStyle = "#afdfff";
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
	ctx.fillStyle = "#afdfff";
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
	ctx.fillStyle = "#afdfff";
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
	ctx.fillStyle = "#afdfff";
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
    let setAreaTo = area;
    switch (e.key.toLowerCase()) {
        case "1":
            setAreaTo = "L001_KO_Zw";
            break;
        case "2":
            setAreaTo = "L004_Zw_Gr";
            break;
        case "3":
            setAreaTo = "L001_Zy_WSD";
            break;
        case "4":
            setAreaTo = "L171_L131";
            break;
        case "5":
            setAreaTo = "L062_L171_SG_Tl";
            break;   
		case "6":
            setAreaTo = "L062_SPł_Sd";
            break;
        case "7":
            setAreaTo = "L008_KG_Kz";
            break;
        case "e":
            setAreaTo = "Settings";
            break;
        case "arrowleft":
        case "a":
            changeSetting(-1);
            break;
        case "arrowright":
        case "d":
            changeSetting(1);
            break;
        case "arrowup":
        case "w":
            changeSelectedSetting(-1);
            break;
        case "arrowdown":
        case "s":
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