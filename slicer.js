/* 
  #split audio into many files
  sox --show-progress LEK_173_AGN_FULL.wav output.wav trim 0 0:0.2 : newfile : restart

  #merge all those back together
  sox output*.wav merged.wav

  #change speed
  sox --show-progress LEK_173_AGN_FULL.wav output.wav speed 10

  #reverse
  sox --show-progress LEK_173_AGN_FULL.wav output.wav reverse

  #play
  play merged.wav

  #3 second, 48kHz, audio file containing a sine-wave swept from 300 to 3300 Hz:
  sox -n output.wav synth 3 sine 300-3300 vol 0.1

  https://github.com/arturadib/shelljs/
  https://github.com/troygoode/node-shuffle/
 */

var shell = require("shelljs");
var shuffle = require("shuffle");
var prefix = "temp_";
var sliceLength = "00:00.40";
var centRange = 2400;

var sliceCmd = "sox --show-progress "+process.argv[2]+" "+prefix+".wav trim 0 " + sliceLength + " : newfile : restart";
console.log("sliceCmd = " + sliceCmd);
shell.exec(sliceCmd);


var inputFiles = shell.ls(prefix+"*.wav");
console.log("inputFiles = "+inputFiles);


function alterSlices(soxEffectCallback, percentOfFilesEffected){
  var actionDeck = shuffle.shuffle({deck:inputFiles});
  var randomSet = actionDeck.draw(Math.floor(actionDeck.length() * percentOfFilesEffected));
  //console.log("randomSet = "+randomSet);

  if(!(randomSet instanceof Array)){
    randomSet = [randomSet];
  } 

  for(var i=0;i<randomSet.length;i++){

    var file = randomSet[i];
    var alterSampleCommand = "sox " + file + " " + prefix + file + " " + soxEffectCallback();
    console.log("alterSampleCommand = "+alterSampleCommand);
    shell.exec(alterSampleCommand);

    shell.rm(file);
    shell.mv(prefix + file, file);
  }
}
alterSlices(function(){return "pitch " + Math.floor(Math.random()*centRange-centRange);},0.25);
alterSlices(function(){return "repeat " + Math.floor(Math.random()*4+1);},0.1);
//alterSlices(function(){return "bend 0," + Math.floor(Math.random()*centRange-centRange) + ",0.19";},0.5);
alterSlices(function(){return "reverse";},0.25);
// alterSlices(function(){return "tremelo";},0.25);
alterSlices(function(){return "reverb";},0.25);
alterSlices(function(){return "tempo " + (0.25 + Math.random()*10);},0.25);


//put back together
var shuffledFile = "shuffled_"+new Date().getTime()+".wav";
//var shuffledFile = "shuffled.wav";
console.log("shuffledFile = "+shuffledFile);
shell.exec("sox " + shuffle.shuffle({deck:inputFiles}).cards.join(" ") + " " + shuffledFile);
shell.rm(prefix + "*.wav");
//shell.exec("play " + shuffledFile);
shell.exec("open -a Taply.app " + shuffledFile);


