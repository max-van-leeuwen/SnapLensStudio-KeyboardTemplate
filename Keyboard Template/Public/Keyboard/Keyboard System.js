// Max van Leeuwen
// maxvanleeuwen.com/lens-studio-keyboard
// ig: @max.van.leeuwen
// tw: @maksvanleeuwen



// --- How to use the keyboard:
// 
// The simple way is to place the 'Get Keyboard Text' script on a scene object that has a Text Component.
// This will automatically display the keyboard text on it.
// If you want more control, use any of these functions in your code:
//
//
//
// - Get the first line of text as a string (function, optional int argument to specify which line if multiline)
// 	global.keyboard.getLine()
// 
// 	Examples:
// 		global.keyboard.getLine()	-  reads first line of text (default)
// 		global.keyboard.getLine(1)	-  reads second line of text
//
//
//
// - Check if keyboard is currently visible (bool)
// 	global.keyboard.isActive
//
//
//
// - Toggle keyboard in/out animation (function)
// 	global.keyboard.toggle()
//
//
//
// - Get or set keyboard out text lines (array)
// 	global.keyboard.lines
//
//
//
// - Get the current line the user is typing in (Number)
// 	global.keyboard.currentLine
//
//
//
// - Check if the user is currently in the Symbols tab (bool)
// 	global.keyboard.symbols
//
//
//
// - Check if the user is currently using Caps Lock (bool)
// 	global.keyboard.capslock
//
//
//
// ---






//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":"Keyboard 0.6"}
//@ui {"widget":"label", "label":"Max van Leeuwen"}
//@ui {"widget":"label", "label":"twitter: @maksvanleeuwen"}
//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":"This object needs a Screen Transform"}
//@ui {"widget":"label", "label":"& Screen Region component,"}
//@ui {"widget":"label", "label":"set to 'Safe Region'."}
//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":"Get the entered text using:"}
//@ui {"widget":"label", "label":"  global.keyboard.getLine()"}
//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":"For more info, open this script or see:"}
//@ui {"widget":"label", "label":"maxvanleeuwen.com/lens-studio-keyboard"}
//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}


//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}

//@ui {"widget":"label", "label":"Starting text (click 'Add Value' for multiline)"}
//@ui {"widget":"separator"}
//@input string[] defaultTextLines


//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}


//@ui {"widget":"label", "label":"Stylize Keys"}
//@ui {"widget":"separator"}
//@input vec3 textColor {"widget":"color"}
//@input Asset.Font font
//@input float fontSize = 30 {"widget":"slider", "min":1.0, "max":45.0, "step":0.01}
//@input Asset.Material keyMaterial


//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}


//@ui {"widget":"label", "label":"Options"}
//@ui {"widget":"separator"}
//@input bool visibleOnStart = true
//@input bool hideWhenRecording = true
//@input bool controlTouchBlocking = true
//@input bool onOffSwitch = true
//@input bool shiftKey = true
//@input bool symbolsKey = true
//@input bool clearKey = true
//@input bool backspaceKey = true
//@input bool previewText = true
//@input float previewTextSize = 30 {"showIf":"previewText"}

//@input float keyWidth = .18 {"widget":"slider", "min":0.01, "max":0.4, "step":0.01}
//@input float keyHeight = .20 {"widget":"slider", "min":0.01, "max":0.8, "step":0.01}
//@input float rowDistance = .21 {"widget":"slider", "min":0.01, "max":0.5, "step":0.01}


//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}


//@ui {"widget":"label", "label":"Advanced"}
//@ui {"widget":"separator"}

//@input bool advanced
//@ui {"widget":"label", "label":""}

//@input int customRenderLayer = 20 {"showIf":"advanced"}
//@input string characters = "qwertyuiopasdfghjklzxcvbnm" {"showIf":"advanced"}
//@input string charactersCaps = "QWERTYUIOPASDFGHJKLZXCVBNM" {"showIf":"advanced"}
//@input string symbols = "1234567890!@#%?_-&|<()+.,>" {"showIf":"advanced"}
//@input string symbolsCaps = "~`^\'\"\\[]{}$€£¥∞-=*/:;°™©•√" {"showIf":"advanced"}
//@input string charactersToSymbols = "..." {"showIf":"advanced"}
//@input string symbolsToCharacters = "abc" {"showIf":"advanced"}
//@input string hidePanel = "↓" {"showIf":"advanced"}
//@input string showPanel = "↑" {"showIf":"advanced"}
//@input string shift = "↑" {"showIf":"advanced"}
//@input string backspace = "←" {"showIf":"advanced"}
//@input string space = "" {"showIf":"advanced"}
//@input string clear = "×" {"showIf":"advanced"}


//@ui {"widget":"label", "label":""}
//@ui {"widget":"label", "label":""}



global.keyboard = {};
global.keyboard.getLine = getLine;
global.keyboard.isActive = true;
global.keyboard.toggle = togglePanel;
global.keyboard.lines = [];
global.keyboard.currentLine = 0;
global.keyboard.symbols = false;
global.keyboard.capslock = false;

const renderLayer = script.customRenderLayer; // 20 is orthographic layer, but user can enter a custom one
const fullScreenTransf = Rect.create(-1, 1, -1, 1);
const screenBounds = Rect.create(-.9, .9, -.95, .95); // extra safe bounds

const row1 = 10; // first row length	qwertyuiop /  1234567890
const row2 = 9; // second row length	asdfghjkl  /  ~`!@#$%^&
const row3 = 7; // third row length 	zxcvbnm	   /  *()_-+=
const rows = row1 + row2 + row3; // standard key counts combined

var containerObj;
var keysParent;
var keyData = [];
var previewTextObject;

var maxLines;

var keyMatIdle;
var keyMatPressed;
var keyToggleMatIdle;
var keyToggleMatPressed;
var keySpaceMatIdle;
var keySpaceMatPressed;



function init(){
	// check assets
	if(!script.keyMaterial){
		print("No key material given!");
		return;
	}

	// if recording, hide keyboard
	if(script.hideWhenRecording){
		stopWhenRecording();
	}

	// start touch blocking, will be disabled if keyboard is not shown
	if(script.controlTouchBlocking) global.touchSystem.touchBlocking = true;

	// build keyboard
	generateKeyData();
	buildKeyboard(keyData);

	for(var i = 0; i < script.defaultTextLines.length; i++){
		global.keyboard.lines[i] = script.defaultTextLines[i];
	}
}
delay(init);



function stopWhenRecording(){
	function recordingCheck(eventData){
		if(global.scene.isRecording()){
			if(script.hideWhenRecording){
				if(script.controlTouchBlocking) global.touchSystem.touchBlocking = false;
				script.getSceneObject().destroy();
			}
		}
	}
	var recordingCheckEvent = script.createEvent("UpdateEvent");
	recordingCheckEvent.bind(recordingCheck);
}



function generateKeyData(){
	var keyCount = 33 + 1; // all keys + toggle key

	// make container object for all keyboard related objects
	containerObj = script.getSceneObject().copySceneObject(script.getSceneObject());
	var _scripts = containerObj.getComponents("Component.Script");
	for(var i  = 0; i < _scripts.length; i++){ _scripts[i].destroy(); }
	containerObj.getComponent("Component.ScreenRegionComponent").destroy();
	containerObj.layer = LayerSet.fromNumber(renderLayer);
	var _screenTransform = containerObj.getComponent("Component.ScreenTransform");
	_screenTransform.anchors = screenBounds;

	// make parent object for keys
	keysParent = containerObj.copySceneObject(containerObj);
	keysParent.name = "keysParent";
	keysParent.getComponent("Component.ScreenTransform").anchors = fullScreenTransf;
	keysParent.layer = LayerSet.fromNumber(renderLayer);


	makeMaterials();

	maxLines = Math.max(script.defaultTextLines.length, 1);

	for(var i = 0; i < keyCount; i++){
		// new key instance
		var newKeyParent = i === 33 ? containerObj : keysParent; // parent one level higher when toggle key (it shouldn't disappear in out anim)
		var newKey = newKeyParent.copySceneObject(containerObj);
		newKey.name = "key_" + i.toString();
		newKey.getComponent("Component.ScreenTransform").anchors = fullScreenTransf;
		newKey.layer = LayerSet.fromNumber(renderLayer);

		// components
		var _image = newKey.createComponent("Component.Image");
		var _interaction = newKey.createComponent("Component.InteractionComponent");
		var _script = newKey.createComponent("Component.Script");

		// set image material
		var newMat;
		if(i === 32){
			newMat = keySpaceMatIdle;
		}else if(i === 33){
			newMat = keyToggleMatIdle;
		}else{
			newMat = keyMatIdle;
		}
		_image.addMaterial(newMat);
		_image.stretchMode = StretchMode.Stretch;

		// set script component
		_script.api.index = i;
		var keyTouchStartEvent = _script.createEvent("TouchStartEvent");
		keyTouchStartEvent.bind(registerTouch);
		var keyTouchStopEvent = _script.createEvent("TouchEndEvent");
		keyTouchStopEvent.bind(stopTouch);

		// make child object for key text
		var newKey2 = newKey.copySceneObject(containerObj);
		newKey2.name = "key_text_" + i.toString();
		newKey2.getComponent("Component.ScreenTransform").anchors = fullScreenTransf;
		newKey2.layer = LayerSet.fromNumber(renderLayer);
		_script.api.key2 = newKey2;

		// components
		var _text2 = newKey2.createComponent("Component.Text");
		_text2.textFill.mode = TextFillMode.Solid;
		_text2.textFill.color = new vec4(script.textColor.x, script.textColor.y, script.textColor.z, 1);



		// placeholder
		var p = new vec2(0, 0);
		var s = new vec2(0, 0);

		// get distance between keys according to first row
		var distance = 2 / row1;

		if(i < row1){
			// x: i * distance, starting at left bounds (-1)
			// y: this is the first row top to bottom, which is the fourth from the bottom (starting at bottom bounds, -1)
			p = new vec2(distance * (i + 1/2) - 1, -1 + 3 * script.rowDistance);
			// x/y: user params
			s = new vec2(script.keyWidth, script.keyHeight);
		}else if(i >= row1 && i < (row1 + row2)){
			// local i
			j = i - row1;
			// x: j * distance, starting at left bounds (-1)
			// y: this is the second row, so third from the bottom (again, starting at bottom bounds, -1)
			p = new vec2( (j + 1) * distance - 1, -1 + 2 * script.rowDistance );
			// x/y: user params
			s = new vec2(script.keyWidth, script.keyHeight);
		}else if(i >= (row1 + row2) && i < (row1 + row2 + row3)){
			// local i
			j = i - (row1 + row2);
			// x: j * distance, starting at left bounds (-1)
			// y: this is the first row, so second from the bottom (again, starting at bottom bounds, -1)
			p = new vec2( (j + 2) * distance - 1, -1 + 1 * script.rowDistance );
			// x/y: user params
			s = new vec2(script.keyWidth, script.keyHeight);
		}

		// line up/down keys
		else if(i == 26){
			p = new vec2( distance * (row1 - 1/2) - 1, -1 + (5 + 1/4) * script.rowDistance );
			s = new vec2(script.keyWidth, script.keyHeight);
		}else if(i == 27){
			p = new vec2( distance * (row1 - 1/2) - 1, -1 + (4 + 1/4) * script.rowDistance );
			s = new vec2(script.keyWidth, script.keyHeight);
		}

		// shift/backspace keys
		else if(i == 28){
			p = new vec2( 1/2 * distance - 1, -1 + 1 * script.rowDistance );
			s = new vec2(script.keyWidth, script.keyHeight);
		}else if(i == 29){
			p = new vec2( distance * (row1 - 1/2) - 1, -1 + 1 * script.rowDistance );
			s = new vec2(script.keyWidth, script.keyHeight);
		}

		// symbols/clear keys
		else if(i == 30){
			p = new vec2( 1/2 * distance - 1, -1 );
			s = new vec2(script.keyWidth, script.keyHeight);
		}else if(i == 31){
			p = new vec2( distance * (row1 - 1 - 1/2) - 1, -1 );
			s = new vec2(script.keyWidth, script.keyHeight);
		}

		// space bar key
		else if(i == 32){
			p = new vec2( distance * (row1 / 2) - 1, -1 );
			s = new vec2( distance * row1 / 2, script.keyHeight);
		}

		// toggle key
		else if(i == 33){
			p = new vec2( distance * (row1 - 1/2) - 1, -1 );
			s = new vec2(script.keyWidth, script.keyHeight);
		}


		// placeholder
		var ch = ''; // key label
		var id = ''; // key value
		
		if (i < rows){
			ch = getKeyText(i);
			id = ch;
		}else if (i == 26){
			ch = "↑";
			id = "_lineUp";
		}else if (i == 27){
			ch = "↓";
			id = "_lineDown"
		}else if (i == 28){
			ch = script.shift;
			id = "_shift";
		}else if (i == 29){
			ch = script.backspace;
			id = "_backspace"
		}else if (i == 30){
			if(global.keyboard.symbols){
				ch = script.symbolsToCharacters;
			}else{
				ch = script.charactersToSymbols;
			}
			id = "_symbolsToggle";
		}else if (i == 31){
			ch = script.clear;
			id = "_clear";
		}else if (i == 32){
			ch = script.space;
			id = "_space";
		}else if (i == 33){
			if(script.visibleOnStart){
				ch = script.hidePanel;
				animToggleKeyboardProgress = 1;
			}else{
				ch = script.showPanel;
				animToggleKeyboardProgress = 0;
			}
			id = "_panelToggle";
		}


		// remove unwanted keys
		if(i == 26){
			newKey.enabled = false;
		}else if (i == 27){
			newKey.enabled = maxLines > 1;
		}else if(i == 28){
			newKey.enabled = script.shiftKey;
		}else if(i == 29){
			newKey.enabled = script.backspaceKey;
		}else if(i == 30){
			newKey.enabled = script.symbolsKey;
		}else if(i == 31){
			newKey.enabled = script.clearKey;
		}else if(i == 33){
			newKey.enabled = script.onOffSwitch;
		}


		var keyDataItem = {"position":p, "scale":s, "text":ch, "obj":newKey, "obj2": newKey2, "id":id, "material":newMat};
		keyData[i] = keyDataItem;
	}
}



function makeMaterials(){
	keyMatIdle = script.keyMaterial;
	
	keyMatPressed = script.keyMaterial.clone();
	keyMatPressed.mainPass.keyPressed = true;


	keyToggleMatIdle = script.keyMaterial.clone();
	keyToggleMatIdle.mainPass.index = 1;

	keyToggleMatPressed = script.keyMaterial.clone();
	keyToggleMatPressed.mainPass.index = 1;
	keyToggleMatPressed.mainPass.keyPressed = true;


	keySpaceMatIdle = script.keyMaterial.clone();
	keySpaceMatIdle.mainPass.index = 2;

	keySpaceMatPressed = script.keyMaterial.clone();
	keySpaceMatPressed.mainPass.index = 2;
	keySpaceMatPressed.mainPass.keyPressed = true;
}



function buildKeyboard(keyData){
	oneFrameInvisibleContainer();

	for(var i = 0; i < Object.keys(keyData).length; i++){
		var p = keyData[i].position;
		var s = keyData[i].scale;
		var ch = keyData[i].text;
		var obj = keyData[i].obj;
		var obj2 = keyData[i].obj2;

		// set positions
		var anchors = obj.getComponent("Component.ScreenTransform").anchors;
		anchors.left = p.x - s.x/2;
		anchors.right = p.x + s.x/2;
		anchors.top = p.y + s.y;
		anchors.bottom = p.y;

		// set text
		var keyText = obj2.getComponent("Component.Text");
		keyText.text = ch;
		keyText.size = i < rows ? script.fontSize : script.fontSize * (2/3); // set font size (a bit smaller for function keys)
		keyText.font = script.font ? script.font : keyText.font;
	}

	if(!script.visibleOnStart){
		togglePanel();
	}

	if(script.previewText){
		makePreviewTextObject();
	}
}



function oneFrameInvisibleContainer(){
	// make everything invisible
	containerObj.enabled = false;

	// make everything visible after 1 frame
	delay(function(){ containerObj.enabled = true; });
}



const moveBackSpeed = 10;
function makePreviewTextObject(){
	previewTextObject = keysParent.copySceneObject(containerObj);
	previewTextObject.enabled = true;
	previewTextObject.name = "text";

	var _text = previewTextObject.createComponent("Component.Text");
	var _interaction = previewTextObject.createComponent("Component.InteractionComponent");
	var _script = previewTextObject.createComponent("Component.Script");

	_text.text = global.keyboard.getLine(global.keyboard.currentLine);
	_text.size = script.previewTextSize;
	_text.dropshadowSettings.enabled = true;
	_text.outlineSettings.enabled = true;

	var textTrf = previewTextObject.getComponent("Component.ScreenTransform");
	var startPos = 0;
	var center = textTrf.anchors.getCenter();
	var dragging = false;

	function textDragStart(eventData){
		startPos = eventData.getTouchPosition().x;
	}
	function textDragMove(eventData){
		var touchPos = eventData.getTouchPosition().x;
		var diff = touchPos - startPos;
		var fastScrolling = Math.ceil(_text.text.length/10 + 1);
		textTrf.anchors.setCenter(new vec2(center.x + diff*fastScrolling, center.y));
		dragging = true;
	}
	function textDragUpdate(){
		if(!dragging){
			var curCenter = textTrf.anchors.getCenter();
			var newX = curCenter.x * Math.min(moveBackSpeed * getDeltaTime(), 1);
			if(Math.abs(newX) < .01) newX = 0;
			textTrf.anchors.setCenter(new vec2(newX, center.y));
		}
		dragging = false;
		_text.text = global.keyboard.getLine(global.keyboard.currentLine);
	}

	var textDragStartEvent = _script.createEvent("TouchStartEvent");
	textDragStartEvent.bind(textDragStart);
	var textDragMoveEvent = _script.createEvent("TouchMoveEvent");
	textDragMoveEvent.bind(textDragMove);
	var textDragUpdateEvent = _script.createEvent("UpdateEvent");
	textDragUpdateEvent.bind(textDragUpdate);
}



function getLine(n){
	var thisLine = global.keyboard.lines[n ? n : 0];
	if(!thisLine) thisLine = "";
	return thisLine;
}



function delay(func, wait, args){
	if(!wait){
		wait = 0;
	}
	const keepAlive = {
		exec: function(){
			_args = args;
			func.apply(null, _args);
		}
	}
	function onUpdate(){
		if(wait < 1){
			script.removeEvent(waitEvent);
			keepAlive.exec();
		}
		wait--;
	}
	var waitEvent = script.createEvent("UpdateEvent");
	waitEvent.bind(onUpdate);
	return waitEvent;
}



function registerTouch(eventData){
	var key = eventData.getSceneObject();
	var keyScript = key.getComponent("Component.Script");
	var index = keyScript.api.index;

	pressKey(index, keyScript);

	if(!(index === 26 || index === 27)){ // line selectors do not change material
		// switch material
		var img = key.getComponent("Component.Image");
		img.clearMaterials();
		if(index === 32){ // if space bar
			img.addMaterial(keySpaceMatPressed);
		}else if(index === 33){ // if toggle
			img.addMaterial(keyToggleMatPressed);
		}else{
			img.addMaterial(keyMatPressed);
		}
	}
}



function stopTouch(eventData){
	var key = eventData.getSceneObject();
	var keyScript = key.getComponent("Component.Script");
	var index = keyScript.api.index;

	// switch material
	var img = key.getComponent("Component.Image");

	if(index === 32){ // if space bar
		img.clearMaterials();
		img.addMaterial(keySpaceMatIdle);
	}else if(index === 33){ // if toggle
		img.clearMaterials();
		img.addMaterial(keyToggleMatIdle);
	}else{
		if(!(
			(index === 28 && global.keyboard.capslock) ||
			(index === 30 && global.keyboard.symbols))) { // symbols and caps lock keys do not go back to idle when active
			img.clearMaterials();
			img.addMaterial(keyMatIdle);
		}
	}
}



function setLineSelector(button, enable){
	var i;
	switch(button){
		case 'up':
			i = 26;
			break;
		case 'down':
			i = 27;
			break;
	}
	keyData[i].obj.enabled = enable
}



function pressKey(i, keyScript){
	switch(keyData[i].id){
		case "_lineDown":
			global.keyboard.currentLine++;
			if(global.keyboard.currentLine > maxLines-1){
				global.keyboard.currentLine--;
				setLineSelector('down', false);
			}else if(global.keyboard.currentLine === maxLines-1){
				setLineSelector('down', false);
			}else{
				setLineSelector('down', true);
			}
			setLineSelector('up', true);
			break;
		case "_lineUp":
			global.keyboard.currentLine--;
			if(global.keyboard.currentLine === 0){
				setLineSelector('up', false);
			}else if(global.keyboard.currentLine < 0){
				global.keyboard.currentLine = 0;
				setLineSelector('up', false);
			}else{
				setLineSelector('up', true);
			}
			setLineSelector('down', true);
			break;
		case "_shift":
			global.keyboard.capslock = !global.keyboard.capslock;
			changeToCaps(global.keyboard.capslock);
			break;
		case "_backspace":
			var curText = global.keyboard.lines[global.keyboard.currentLine];
			if(curText){
				if(curText.length > 0){
					global.keyboard.lines[global.keyboard.currentLine] = curText.slice(0, -1);
				}
			}
			break;
		case "_symbolsToggle":
			global.keyboard.symbols = !global.keyboard.symbols;
			changeToSymbols(global.keyboard.symbols);
			break;
		case "_clear":
			global.keyboard.lines = [];
			break;
		case "_space":
			var str = global.keyboard.lines[global.keyboard.currentLine];
			if(!str){
				str = "";
			}
			global.keyboard.lines[global.keyboard.currentLine] = str + " ";
			break;
		case "_panelToggle":
			togglePanel();
			var newKeyText = global.keyboard.isActive ? script.hidePanel : script.showPanel;
			keyScript.api.key2.getComponent("Component.Text").text = newKeyText;
			break;
		default:
			var thisKeyText = keyData[i].id;
			global.keyboard.lines[global.keyboard.currentLine] = global.keyboard.getLine(global.keyboard.currentLine) + thisKeyText;
	}
}



function changeToCaps(caps){
	global.keyboard.capslock = caps;
	for(var i = 0; i < rows; i++){
		var newText = getKeyText(i);
		keyData[i].obj2.getComponent("Component.Text").text = newText;
		keyData[i].id = newText;
	}
}



function changeToSymbols(symbols){
	global.keyboard.symbols = symbols;
	for(var i = 0; i < rows; i++){
		var newText = getKeyText(i);
		keyData[i].obj2.getComponent("Component.Text").text = newText;
		keyData[i].id = newText;
	}
}



function getKeyText(i){
	var ch;
	if(global.keyboard.symbols){
		if(global.keyboard.capslock){
			ch = script.symbolsCaps[i];
			// fix backslash escape characters
			if(ch == "\\"){
				ch = "\\\\";
			}
		}else{
			ch = script.symbols[i];
		}
	}else{
		if(global.keyboard.capslock){
			ch = script.charactersCaps[i];
		}else{
			ch = script.characters[i];
		}	
	}
	return ch;
}



function togglePanel(){
	if(global.keyboard.isActive){
		if(script.controlTouchBlocking) global.touchSystem.touchBlocking = false;
		global.keyboard.isActive = false;
		animToggleKeyboard('out');
	}else{
		if(script.controlTouchBlocking) global.touchSystem.touchBlocking = true;
		global.keyboard.isActive = true;
		animToggleKeyboard('in');
	}
}



var animToggleKeyboardEvent;
var animToggleKeyboardProgress;
function animToggleKeyboard(version){
	if(animToggleKeyboardEvent){
		script.removeEvent(animToggleKeyboardEvent);
		animToggleKeyboardEvent = undefined;
	}

	var from = animToggleKeyboardProgress;	// starting value
	var to;									// end value
	var duration;							// duration of animation
	var easeFunction;						// easing function (using Tween functions)
	var easeType;							// easing type ("In", "Out", "InOut")
	var distanceOut = -2; 					// animation out distance

	switch(version){
		case "in":
			to 				= 1;
			duration 		= .4;
			easeFunction	= "Cubic";
			easeType 		= "InOut";
			break;
		case "out":
			to 				= 0;
			duration 		= .4;
			easeFunction	= "Cubic";
			easeType 		= "InOut";
			break;
	}

	function setValue(v){
		// update position
		var y = (1-v) * distanceOut;
		var newCenter = new vec2(0, y);
		keysParent.getComponent("Component.ScreenTransform").anchors.setCenter(newCenter);

		// update key material
		keyMatIdle.mainPass.visibility = v;
		keyMatPressed.mainPass.visibility = v;

		previewTextObject.getComponent("Component.ScreenTransform").scale = new vec3(v, v, v);

		// store current progress, in case animation is restarted from here
		animToggleKeyboardProgress = v;
	}

	var anim = 0;
	function animation(){
		anim += getDeltaTime()/duration;
		if(anim > 1){
			anim = 1;
			script.removeEvent(animToggleKeyboardEvent);
		}

		var v = interp(clamp(anim, 0, 1), from, to, easeFunction, easeType);
		setValue(v);
	}
	animToggleKeyboardEvent = script.createEvent("UpdateEvent");
	animToggleKeyboardEvent.bind(animation);
}



function interp(t, startValue, endValue, easing, type){
	// don't overshoot
	t = clamp(t, 0, 1);

	// get easing function + type
	var easingFunction = easingFunctions[easing];
	var easingType = easingFunction[type];

	// remap
	return easingType(t) * (endValue-startValue) + startValue;
}



function clamp(value, low, high){
	return Math.max(Math.min(value, Math.max(low, high)), Math.min(low, high));
}



var easingFunctions = {
	Cubic: {
		InOut: function (k) {
			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}
			return 0.5 * ((k -= 2) * k * k + 2);
		}
	}
};