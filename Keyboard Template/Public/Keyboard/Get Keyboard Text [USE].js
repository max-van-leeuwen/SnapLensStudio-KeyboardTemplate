// Max van Leeuwen
// maxvanleeuwen.com/lens-studio-keyboard
// ig: @max.van.leeuwen
// tw: @maksvanleeuwen

// Example script showing how to get text from the keyboard.
// See the top of the Keyboard System script or my website for more information.



//@input Component.Text textComponent
//@input int line {"min": 0}



// determine which text component to use
var textComponent;

if(script.textComponent){ // use from inspector
	textComponent = script.textComponent;

}else if(script.getSceneObject().getComponents("Component.Text").length > 0){ // use from this scene object, if one was found
	textComponent = script.getSceneObject().getComponent("Component.Text");

}else{ // none found, don't know what to do with text now
	print("No textcomponent found on object: " + script.getSceneObject().name);
}



// do on every frame
function onUpdate(){
	// only if text component was found
	if(textComponent){
		var keyboardText = global.keyboard.getLine( script.line ); // get text from the current line (default is the first line: 0)
		textComponent.text = keyboardText; // set text to component
	}
}
script.createEvent("UpdateEvent").bind(onUpdate);