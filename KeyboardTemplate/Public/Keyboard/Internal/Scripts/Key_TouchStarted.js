// Max van Leeuwen - maxvanleeuwen.com


//@input Asset.Material KeyPress
//@input Component.Image img



// do not press buttons during animation
if( !global.KeyboardButtonCooldown ){

	// set material to key pressed
	script.img.clearMaterials();
	script.img.addMaterial(script.KeyPress);

}