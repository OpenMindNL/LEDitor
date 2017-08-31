var	max_fields = 200,		//maximum frames allowed by Homey
	count_frames = 0,		//used frames
	selectedAnimation = 0,
	selectedFrame = 0,
	enableAniRename = false,	// Animation rename is enabled?
	enableAniCopy = false;		// Animation copy is enabled?

function openAnimationIndex(){
	// get stored animation index
	getSettingAnimationIndex();
}

function storeAniIndex(){
	// store animation index
	setSettingAnimationIndex();
}

function clickAniRename(setNewName){
	if(setNewName == undefined){setNewName = true;}

	enableAniRename = !enableAniRename;
	if(enableAniRename){
		but_copy_ani.disabled = true;
		dropAnimation.disabled = true;
		but_rename_ani.style.backgroundColor = '#e0ffe0';
		inName.style.visibility = 'visible';
		inName.value = aniIndex[selectedAnimation].name;
	} else {
		if(setNewName){
			aniIndex[selectedAnimation] = {name: inName.value.trim()};
			storeAniIndex();
		}
		openAnimationIndex();
		but_copy_ani.disabled = false;
		dropAnimation.disabled = false;
		but_rename_ani.style.backgroundColor = butColorDef;

		inName.style.visibility = 'hidden';
	}
}

function checkForKey(obj, objEvent){ // check text input ENTER & ESC key strokes
	var keyC = objEvent.keyCode;
	switch(obj.id){
	case 'inName':
		if (enableAniRename && keyC == 13) { // ENTER key
			clickAniRename();
		}
		if (enableAniRename && keyC == 27) { // ESC key
			clickAniRename(false);
		}
		break;
	}
}

function changeAniName(obj){
	xName = obj.value;
	for(var i=0; i < xName.length; i++){
		var	checkCode = xName.charCodeAt(i),
			checkChar = xName.charAt(i);

		if(checkCode < 32 || checkCode > 126 || checkCode == 34 || checkCode == 39){// not allowed
			xName = xName.substr(0, i) + xName.substr(i+1);
			obj.value = xName;
		}
	}
}


// ************ Save / Open animation ************
function saveAnimation(id){
	if(id == undefined){
		id = selectedAnimation;
	}
	if(id == ''){
		var xRepeat = inRepeat.value;
	} else {
		var xRepeat = 1;
	}
	var	aniId = 'animation' + id,
		aniDuration = xRepeat * Math.round(1000 * ledFrames.length / inFPS.value),
		xFPS = Number(inFPS.value), xTFPS = Number(inTFPS.value), xRPM = Number(inRPM.value),
		aniData = {
			options: {
				fps	: xFPS, 	// animation frames per second
				tfps	: xTFPS, 	// view frames per second. every second will be interpolated xTFPS.value times
				rpm	: xRPM,		// ring rotations per minute
			},
			frames	: ledFrames,
			priority: 'INFORMATIVE',	// CRITICAL, FEEDBACK or INFORMATIVE
			duration: aniDuration		// duration in ms, or keep empty for infinite
		};

	setSettingAnimation(aniId, aniData);
}

function openAnimation(id){
	if(id == undefined){id = selectedAnimation;}

	showMessage('load_animation');
	var aniId = 'animation' + id;
	playFrame = 0;
	getSettingAnimation(aniId);
}

function selectAnimation(obj){
	var id = Number(obj.value.substr(4));
	if(id != selectedAnimation){
		if(enableAniCopy){
			openAnimation(id);
		} else {
			selectedAnimation = id;
			openAnimation();
		}
		but_copy_ani.title = thisApp.text.ani_copy.replace('###', selectedAnimation+1);
	}
}

function showAnimationTime(){
	var	aniDuration = ledFrames.length / inFPS.value,
		repeatDuration = aniDuration * inRepeat.value,
		m = Math.floor(repeatDuration / 60).toString(),
		s = Math.round(repeatDuration - Math.floor(repeatDuration / 60) * 60).toString();

	if(s.length <2){s = '0' + s;}
	document.getElementById('aniTime').innerHTML = ' = ' + aniDuration.toFixed(2) + ' sec.';
	document.getElementById('repeatTime').innerHTML = '= ' + m + ':' + s;
}

function clickAniCopy(){
	enableAniCopy = !enableAniCopy;
	if(enableAniCopy){
		but_rename_ani.disabled = true;
		but_copy_ani.style.backgroundColor = '#ffe0e0';
		dropAnimation.style.backgroundColor = '#ffe0e0';
	} else {
		but_rename_ani.disabled = false;
		but_copy_ani.style.backgroundColor = butColorDef;
		dropAnimation.style.backgroundColor = butColorDef;
	}
}


// ********** frame list **********

function frameSelect(obj){
	if(document.getElementById(obj.id) == undefined){return;}
	var idx = obj.id;
	but_generator_close.click();
	selectedFrame = Number(idx.substr(9));
	activateSelect();
}

function activateSelect(){
	var xCol = getTopColor();
	if(selectedFrame >= ledFrames.length){
		selectedFrame = ledFrames.length - 1;
	}
	for(var i = 0; i < ledFrames.length; i++){
		var xElement = document.getElementById('frameLine' + i);
		if(i == selectedFrame){
			document.getElementById('frameLine' + i).style.backgroundColor = '#808080';
			document.getElementById('frameLine' + i).style.color = xCol.t;
		} else {
			document.getElementById('frameLine' + i).style.backgroundColor = xCol.b;
			document.getElementById('frameLine' + i).style.color = xCol.t;
		}
	}

	ledFrame = ledFrames[selectedFrame].slice(0);
	refreshLedMarkers();
	refreshFrameNr(selectedFrame + 1);
	drawLedRing();
	refreshButtons();
	but_frame_add.title = thisApp.text.frame_add.replace('###', selectedFrame+1);
	but_frame_copy.title = thisApp.text.frame_copy.replace('###', selectedFrame+1);
	showOnHomey(ledFrames[selectedFrame]);
}

function refreshFramesList(){
	divFrameScroll.style.backgroundColor = getTopColor().b;
	var tempDoc = '';
	ledFrames.forEach(function(item, index){
		xFrame = ledFrames[index].slice(0);
		tempDoc = tempDoc + getFrameListRow(index, getTooltip('frame', index + 1));
	});
	tableFrames.innerHTML = tempDoc;
	drawAllFramePreviews();
	activateSelect();
}

function refreshFrameNr(nr){
	frameNumber.innerHTML = 'Frame: ' + nr;
}


function drawFramePreview(idx){ // idx = frame nr.
	if(ledFrames[idx] != undefined && selectedFrame>=0){
		var	canvPrev = document.getElementById('canvPre'+idx),
			ctxPrev = canvPrev.getContext("2d"),
			colW = canvPrev.width/24,
			xCol = getTopColor();
			pos = [], //{x:0, y:0}
			ledArray = [],
			yPos = canvPrev.height * 0.4;
			colH = colW;

		// calc led positions
		pos.push({x:0, y:yPos});
		ledArray.push(ledFrames[idx][9])

		ledFrames[idx].forEach(function(item, index){
			var xPos = 8 - index;
			if(xPos < 0){xPos += 24;}
			xPos = xPos * colW + colW + 1;
			pos.push({x:xPos, y:yPos});
			ledArray.push(item)
		});

		ctxPrev.clearRect(0, 0, canvPrev.width, canvPrev.height);
		drawLedGroup(canvPrev, pos, ledArray, colW * 0.9, 3, 0, canvPrev.height * 0.4 - colH / 2, canvPrev.width, colH);

		// clear around led bar
		ctxPrev.globalCompositeOperation = 'source-over';

		// draw markers
		ctxPrev.globalCompositeOperation = 'source-over';
		ctxPrev.strokeStyle = xCol.t;
		ctxPrev.lineWidth = 0.5;
		ledFrames[idx].forEach(function(item, index){
			var xPos = 8-index;

			if(xPos < 0){xPos += 24;}
			if(index == 9){
				ctxPrev.strokeRect(0, canvPrev.height*0.85 , 0, canvPrev.height*0.2);
			}
			if(Math.floor((index+3) / 6) * 6 == index+3){
				ctxPrev.strokeRect(xPos * colW + colW, canvPrev.height*0.85 , 1, canvPrev.height*0.15);
			} else {
				ctxPrev.strokeRect(xPos * colW + colW, canvPrev.height*0.9 , 0, canvPrev.height*0.1);
			}
		});
		ctxPrev.globalCompositeOperation = 'source-over';
	}
}

var timeoutDrawAllFramePreviews = null;
function drawAllFramePreviews(){
	clearTimeout(timeoutDrawAllFramePreviews);
	timeoutDrawAllFramePreviews = setTimeout(function(){
		for(var i = 0; i < ledFrames.length; i++){
			drawFramePreview(i);
		}
		showMessage('');
	}, 500);
}

function getTooltip(txt, nr){
	return (thisApp.text.remove + ' ' + txt + ' ' + nr);
}

function getFrameListRow(idx, titRemove){
	var xCol = getTopColor();
	trLine = '<tr id="frameLine' + idx + '" style="background-color:' + xCol.b + '; color:' + xCol.t + '; border: 1px solid #707070;" onmouseover="showFrameControls(this);" onmouseout="hideFrameControls(this);" onClick="frameSelect(this);">';
	trLine += '<td style="width: 30px; text-align: center; font-size: 12px;">' + (idx+1) + '</td>';
	trLine += '<td style="width: 264px;"><canvas id="canvPre' + idx + '" width=264 height=20></canvas></td>';
	trLine += '<td style="width: 5px;"></td>';
	trLine += '<td style="width: 18px;">';
	if(idx > 0){
		trLine += '<button id="moveUp' + idx + '" style="visibility: hidden; width:18px; height:18px; padding: 0px 0px;" title="' + thisApp.text.move_up + '" onmousedown="clickFrameMove(this);"><img src="../assets/images/frame_up.png" height="16" width="16" style="float: center;"></button>';
	}
	trLine += '</td>';

	trLine += '<td style="width: 18px;">';
	if(idx < ledFrames.length-1){
		trLine += '<button id="moveDown' + idx + '" style="visibility: hidden; width:18px; height:18px; padding: 0px 0px;" title="' + thisApp.text.move_down + '" onmousedown="clickFrameMove(this);"><img src="../assets/images/frame_down.png" height="16" width="16" style="float: center;"></button>';
	}
	trLine += '</td>';

	trLine += '<td style="width: 18px;"></td>';
	trLine += '<td style="width: 18px;"><button id="rem' + idx + '" style="visibility: hidden; width:18px; height:18px; padding: 0px 0px;" title="' + titRemove + '" onmouseover="this.style.backgroundColor =\'#f44336\';" onmouseout="this.style.backgroundColor=\'#eeeeee\';" onclick="removeFrame(this);"><img src="../assets/images/frame_delete.png" height="16" width="16" style="float: center;"></button></td>';

	trLine += '<td></td>';
	trLine += '</tr>';
	return (trLine);
}

function showFrameControls(obj){
	if(!playMode){
		xId = Number(obj.id.substr(9));
		if(xId > 0){document.getElementById('moveUp' + xId).style.visibility = 'visible';}
		if(xId < ledFrames.length-1){document.getElementById('moveDown' + xId).style.visibility = 'visible';}
		document.getElementById('rem' + xId).style.visibility = 'visible';
	}
}

function hideFrameControls(obj){
	xId = Number(obj.id.substr(9));
	if(xId > 0){document.getElementById('moveUp' + xId).style.visibility = 'hidden';}
	if(xId < ledFrames.length-1){document.getElementById('moveDown' + xId).style.visibility = 'hidden';}
	document.getElementById('rem' + xId).style.visibility = 'hidden';
}

function clickFrameMove(obj){
	var	xId = obj.id,
		newFrames = [];

	if(xId.substr(0,6) == 'moveUp'){
		var xMove = -1;
		xId = Number(xId.substr(6));
	} else {
		var xMove = 1;
		xId = Number(xId.substr(8));
	}
	var tempFrame = ledFrames[xId + xMove].slice(0);
	ledFrames[xId + xMove] = ledFrames[xId].slice(0);
	ledFrames[xId] = tempFrame.slice(0);

	drawFramePreview(xId + xMove);
	drawFramePreview(xId);
	actionUndo();
	selectedFrame = xId + xMove;
	frameSelect({id:'frameLine'+selectedFrame});
	divFrameScroll.scrollTop += (document.getElementById('frameLine0').offsetHeight * xMove) ;
}



function refreshCounter(stepVal){
// frames counter.
// <stepVal> = count_frames change.
// <stepVal> = undefined --> reset: set count_frames = 0

	if(stepVal == undefined){
		count_frames = 0;
	} else{
		count_frames += stepVal;
	}
	refreshButtons();
	xDoc = document.getElementById("frameCount");
	var xCount = count_frames + ' frame';
	if(count_frames > 1){xCount += 's';}
	xDoc.innerHTML = xCount;
	showAnimationTime();
}



// ************** PLAY WITH HOMEY **************
var	playPrevMode = false,
	previewPlayTimer = null;

function clickPrev(obj){
	playPrevMode = !playPrevMode;

	if(playPrevMode){	// play preview
		showMessage('send_animation');
		butPreview.innerHTML = '<img src="../assets/images/homey_working.png" height="30" width="30" style="float: center;">';
		var	tLoad = ledFrames.length * 12, // wait 12ms for each frame to upload.
			tDuration = Math.ceil(ledFrames.length / inFPS.value * 1000 * inRepeat.value);

		setTimeout(function(){// wait 0.5 sec for icon to change to 'working'.
			setTimeout(function(){ // wait tLoad for frames to upload.
				showMessage('');
				butPreview.innerHTML = '<img src="../assets/images/homey_stop.png" height="30" width="30" style="float: center;">';

				previewPlayTimer = setTimeout(function(){// wait animation duration.
					clickPrev(butPreview);

				}, (tDuration));
			}, (tLoad));
			saveAnimation('');

		}, 500);

	} else {	// stop preview
		showMessage('');
		clearTimeout(previewPlayTimer);
		var	frames = [emptyFrame.slice(0)],
			saveAni = { // create animation with 1 empty frame
				options: {
					fps	: 30,
					tfps	: 60,
					rpm	: 0,
				},
				frames	: frames,
				priority: 'INFORMATIVE',
				duration: 10	// duration in ms
			}

		setSettingAnimation('animation', saveAni);
		butPreview.innerHTML = '<img src="../assets/images/homey_play.png" height="30" width="30" style="float: center;">';
	}
}
// ************** END PLAY WITH HOMEY **************
